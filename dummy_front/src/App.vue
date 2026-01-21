<script setup la>
import { ref } from 'vue'

const jobs = [
  { id: 1, title: 'Software Engineer', reference: 'REF123' },
  { id: 2, title: 'Product Manager', reference: 'REF456' },
  { id: 3, title: 'Data Scientist', reference: 'REF789' },
  { id: 4, title: 'DevOps Engineer', reference: 'REF101' },
  { id: 5, title: 'UI/UX Designer', reference: 'REF102' },
]


const selectedJob = ref(null)
const cvText = ref('')
const submitted = ref(false)
const isSubmitting = ref(false)
const isProcessing = ref(false)
const submitError = ref(null)

// Notification state
const notifications = ref([])
let notificationId = 0

function addNotification(message, type = 'info') {
  const id = ++notificationId
  notifications.value.push({ id, message, type })

  // Auto-remove after 5 seconds
  setTimeout(() => {
    removeNotification(id)
  }, 5000)
}

function removeNotification(id) {
  notifications.value = notifications.value.filter(n => n.id !== id)
}

async function watchWorkflow(workflowId, runId) {
  const stepNames = {
    'get-open-positions': 'Fetching Open Positions',
    'evaluate-candidate': 'Evaluating Candidate',
    'send-evaluation': 'Sending Evaluation',
    'anchor-trace': 'Recording Audit Trail'
  }

  try {
    const watchRes = await fetch(`http://localhost:4111/api/workflows/${workflowId}/watch?runId=${runId}`, {
      method: 'GET',
      headers: {
        "Accept": "application/x-ndjson, application/json, text/event-stream",
      },
    })

    if (!watchRes.ok || !watchRes.body) {
      throw new Error(`watch failed: ${watchRes.status}`);
    }

    const reader = watchRes.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { value, done } = await reader.read();
      if (done) {
        isProcessing.value = false
        submitted.value = true
        break;
      }

      buffer += decoder.decode(value, { stream: true });

      // The stream format is: "{...json1...}""{...json2...}"
      // Events are quoted JSON strings concatenated with ""
      // Split on "" to separate events, then parse each
      console.log('Buffer chunk:', buffer)
      const events = buffer.split('""')
      console.log('Received events chunk:', events)
      
      // Keep the last part in buffer (might be incomplete)
      buffer = events.pop() || ''
      
      for (const eventStr of events) {
        if (!eventStr) continue
        
        // Remove leading/trailing quotes and unescape the JSON string
        let jsonStr = eventStr
        if (jsonStr.startsWith('"')) jsonStr = jsonStr.slice(1)
        if (jsonStr.endsWith('"')) jsonStr = jsonStr.slice(0, -1)
        
        // Unescape the JSON (it's a quoted string with escaped quotes inside)
        try {
          // The content is escaped JSON, so we need to unescape it
          const unescaped = jsonStr.replace(/\\"/g, '"').replace(/\\\\/g, '\\')
          const data = JSON.parse(unescaped)
          
          // Handle step completion (currentStep with status success)
          if (data.type === 'watch' && data.payload?.currentStep) {
            const step = data.payload.currentStep
            if (step.status === 'success') {
              const stepName = stepNames[step.id] || step.id
              addNotification(`✓ ${stepName}`, 'success')
            }
          }
          
          // Handle workflow completion (workflowState with final status)
          if (data.type === 'watch' && data.payload?.workflowState) {
            const workflowState = data.payload.workflowState
            if (workflowState.status === 'success') {
              addNotification('🎉 Application review complete!', 'success')
              isProcessing.value = false
              submitted.value = true
            } else if (workflowState.status === 'failed') {
              addNotification('Application review failed', 'error')
              isProcessing.value = false
            }
          }
        } catch (e) {
          console.error('Failed to parse event:', e, jsonStr)
        }
      }
    }
  } catch (error) {
    console.error('Watch error:', error)
    addNotification('Lost connection to workflow updates', 'error')
    isProcessing.value = false
  }
}


function selectJob(job) {
  selectedJob.value = job
  submitted.value = false
  submitError.value = null
}

async function submitApplication() {
  if (selectedJob.value && cvText.value.trim()) {
    isSubmitting.value = true
    submitError.value = null

    try {
      // Step 1: Create a run and get the runId
      const createRunResponse = await fetch('http://localhost:4111/api/workflows/evaluationWorkflow/create-run', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      })

      if (!createRunResponse.ok) {
        throw new Error(`Failed to create run: ${createRunResponse.status}`)
      }

      const { runId } = await createRunResponse.json()
      // addNotification(`Application submitted. Tracking ID: ${runId.slice(0, 8)}...`, 'info')

      // Step 2: Start watching the workflow for updates (before starting)
      watchWorkflow('evaluationWorkflow', runId)

      // Step 3: Start the workflow with the runId and inputData
      const startResponse = await fetch(`http://localhost:4111/api/workflows/evaluationWorkflow/start?runId=${runId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputData: {
            referenceNumber: selectedJob.value.reference,
            resume: cvText.value.trim()
          }
        })
      })

      if (!startResponse.ok) {
        throw new Error(`Failed to start workflow: ${startResponse.status}`)
      }

      addNotification(`Processing your application ... Tracking ID: ${runId.slice(0, 8)}...`, 'info')

      isProcessing.value = true
    } catch (error) {
      submitError.value = error.message || 'Failed to submit application'
      addNotification(error.message || 'Failed to submit application', 'error')
      console.error('Submission error:', error)
    } finally {
      isSubmitting.value = false
    }
  }
}


function resetForm() {
  selectedJob.value = null
  cvText.value = ''
  submitted.value = false
  isProcessing.value = false
  submitError.value = null
}
</script>

<template>
  <div class="app-container">
    <!-- Notifications -->
    <div class="notifications-container">
      <transition-group name="notification">
        <div v-for="notification in notifications" :key="notification.id"
          :class="['notification', `notification-${notification.type}`]" @click="removeNotification(notification.id)">
          <span class="notification-icon">
            <template v-if="notification.type === 'success'">✓</template>
            <template v-else-if="notification.type === 'error'">✕</template>
            <template v-else>ℹ</template>
          </span>
          <span class="notification-message">{{ notification.message }}</span>
          <button class="notification-close">×</button>
        </div>
      </transition-group>
    </div>

    <header class="app-header">
      <h1>Job Application Board</h1>
      <p class="subtitle">Find your next opportunity</p>
    </header>

    <!-- AI Transparency Banner -->
    <div class="ai-banner">
      <div class="ai-banner-content">
        <div class="ai-banner-left">
          <span class="ai-chip">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="3" />
              <path d="M12 1v4M12 19v4M4.2 4.2l2.8 2.8M17 17l2.8 2.8M1 12h4M19 12h4M4.2 19.8l2.8-2.8M17 7l2.8-2.8" />
            </svg>
            AI-Assisted
          </span>
          <span class="ai-banner-text">Applications screened by certified AI · EU AI Act compliant</span>
        </div>
        <div class="audit-badge">
          <svg class="badge-shield" viewBox="0 0 24 24" fill="none">
            <path d="M12 2L3 7V12C3 17.25 6.85 22.04 12 23C17.15 22.04 21 17.25 21 12V7L12 2Z"
              fill="rgba(255,255,255,0.15)" stroke="rgba(255,255,255,0.6)" stroke-width="1.5" />
            <path d="M9 12L11 14L15 10" stroke="white" stroke-width="2" stroke-linecap="round"
              stroke-linejoin="round" />
          </svg>
          <div class="badge-info">
            <span class="badge-label">FairTech Alliance</span>
            <span class="badge-verified">Verified 2026</span>
          </div>
        </div>
      </div>
    </div>

    <main class="main-content">
      <!-- Processing State -->
      <div v-if="isProcessing" class="processing-card">
        <div class="processing-spinner">
          <div class="spinner-ring"></div>
          <div class="spinner-ring"></div>
          <div class="spinner-ring"></div>
        </div>
        <h2>Processing Your Application</h2>
        <p>Our AI is reviewing your CV for <strong>{{ selectedJob.title }}</strong></p>
        <p class="processing-hint">This may take a moment. Check the notifications for updates.</p>
      </div>

      <!-- Success Message -->
      <div v-else-if="submitted" class="success-card">
        <div class="success-icon">✓</div>
        <h2>Application Submitted!</h2>
        <p>Thank you for applying to <strong>{{ selectedJob.title }}</strong></p>
        <p class="reference">Reference: {{ selectedJob.reference }}</p>
        <button @click="resetForm" class="btn btn-primary">Apply for Another Job</button>
      </div>

      <template v-else>
        <!-- Job Listings -->
        <section class="jobs-section">
          <h2>Available Positions</h2>
          <div class="jobs-list">
            <div v-for="job in jobs" :key="job.id" :class="['job-card', { selected: selectedJob?.id === job.id }]"
              @click="selectJob(job)">
              <h3>{{ job.title }}</h3>
              <span class="job-reference">{{ job.reference }}</span>
            </div>
          </div>
        </section>

        <!-- Application Form -->
        <section v-if="selectedJob" class="application-section">
          <h2>Apply for {{ selectedJob.title }}</h2>
          <p class="selected-reference">Reference: {{ selectedJob.reference }}</p>

          <form @submit.prevent="submitApplication" class="application-form">
            <div class="form-group">
              <label for="cv">Paste your CV (plain text)</label>
              <textarea id="cv" v-model="cvText" placeholder="Paste your CV here..." rows="12" required
                :disabled="isSubmitting"></textarea>
            </div>
            <div v-if="submitError" class="error-message">
              {{ submitError }}
            </div>
            <button type="submit" class="btn btn-primary" :disabled="!cvText.trim() || isSubmitting">
              <span v-if="isSubmitting" class="loading-spinner"></span>
              {{ isSubmitting ? 'Submitting...' : 'Submit Application' }}
            </button>
          </form>
        </section>

        <section v-else class="placeholder-section">
          <div class="placeholder-content">
            <span class="placeholder-icon">👈</span>
            <p>Select a job from the list to apply</p>
          </div>
        </section>
      </template>
    </main>
  </div>
</template>

<style scoped>
.app-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 2rem;
}

.app-header {
  text-align: center;
  color: white;
  margin-bottom: 2rem;
}

.app-header h1 {
  font-size: 2.5rem;
  margin: 0;
  font-weight: 700;
}

.subtitle {
  opacity: 0.9;
  font-size: 1.1rem;
  margin-top: 0.5rem;
}

.main-content {
  max-width: 1200px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 1fr 1.5fr;
  gap: 2rem;
}

/* Jobs Section */
.jobs-section,
.application-section,
.placeholder-section {
  background: white;
  border-radius: 16px;
  padding: 1.5rem;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
}

.jobs-section h2,
.application-section h2 {
  margin: 0 0 1rem 0;
  color: #333;
  font-size: 1.3rem;
}

.jobs-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.job-card {
  padding: 1rem 1.25rem;
  border: 2px solid #e8e8e8;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.job-card:hover {
  border-color: #667eea;
  transform: translateX(4px);
}

.job-card.selected {
  border-color: #667eea;
  background: linear-gradient(135deg, #667eea10 0%, #764ba210 100%);
}

.job-card h3 {
  margin: 0 0 0.25rem 0;
  font-size: 1rem;
  color: #333;
}

.job-reference {
  font-size: 0.8rem;
  color: #888;
  font-family: monospace;
}

/* Application Section */
.selected-reference {
  color: #888;
  font-size: 0.9rem;
  margin-bottom: 1.5rem;
  font-family: monospace;
}

.application-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group label {
  font-weight: 600;
  color: #444;
  font-size: 0.9rem;
}

.form-group textarea {
  padding: 1rem;
  border: 2px solid #e8e8e8;
  border-radius: 12px;
  font-size: 0.95rem;
  font-family: inherit;
  resize: vertical;
  transition: border-color 0.2s ease;
}

.form-group textarea:focus {
  outline: none;
  border-color: #667eea;
}

.form-group textarea:disabled {
  background: #f5f5f5;
  cursor: not-allowed;
}

.form-group textarea::placeholder {
  color: #aaa;
}

/* Error Message */
.error-message {
  padding: 0.75rem 1rem;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 8px;
  color: #dc2626;
  font-size: 0.875rem;
}

/* Buttons */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.875rem 1.5rem;
  border: none;
  border-radius: 10px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

/* Loading Spinner */
.loading-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Placeholder */
.placeholder-section {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 300px;
}

.placeholder-content {
  text-align: center;
  color: #888;
}

.placeholder-icon {
  font-size: 3rem;
  display: block;
  margin-bottom: 1rem;
}

/* Processing Card */
.processing-card {
  grid-column: 1 / -1;
  background: white;
  border-radius: 16px;
  padding: 3rem;
  text-align: center;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
}

.processing-card h2 {
  margin: 0 0 1rem 0;
  color: #333;
}

.processing-card p {
  color: #666;
  margin: 0.5rem 0;
}

.processing-hint {
  font-size: 0.875rem;
  color: #888;
  margin-top: 1rem;
}

.processing-spinner {
  width: 80px;
  height: 80px;
  position: relative;
  margin: 0 auto 1.5rem;
}

.spinner-ring {
  position: absolute;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  border: 4px solid transparent;
}

.spinner-ring:nth-child(1) {
  border-top-color: #667eea;
  animation: spinRing 1.2s cubic-bezier(0.5, 0, 0.5, 1) infinite;
}

.spinner-ring:nth-child(2) {
  border-right-color: #764ba2;
  animation: spinRing 1.2s cubic-bezier(0.5, 0, 0.5, 1) infinite;
  animation-delay: -0.4s;
}

.spinner-ring:nth-child(3) {
  border-bottom-color: #667eea;
  animation: spinRing 1.2s cubic-bezier(0.5, 0, 0.5, 1) infinite;
  animation-delay: -0.8s;
}

@keyframes spinRing {
  0% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(360deg);
  }
}

/* Success Card */
.success-card {
  grid-column: 1 / -1;
  background: white;
  border-radius: 16px;
  padding: 3rem;
  text-align: center;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
}

.success-icon {
  width: 80px;
  height: 80px;
  background: linear-gradient(135deg, #4ade80 0%, #22c55e 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2.5rem;
  color: white;
  margin: 0 auto 1.5rem;
}

.success-card h2 {
  margin: 0 0 1rem 0;
  color: #333;
}

.success-card p {
  color: #666;
  margin: 0.5rem 0;
}

.success-card .reference {
  font-family: monospace;
  color: #888;
  font-size: 0.9rem;
  margin-bottom: 1.5rem;
}

/* Responsive */
@media (max-width: 768px) {
  .main-content {
    grid-template-columns: 1fr;
  }

  .app-header h1 {
    font-size: 1.8rem;
  }

  .ai-banner-content {
    flex-direction: column;
    gap: 0.75rem;
    text-align: center;
  }

  .ai-banner-left {
    flex-direction: column;
    gap: 0.5rem;
  }
}

/* AI Banner */
.ai-banner {
  max-width: 1200px;
  margin: 0 auto 1.5rem;
}

.ai-banner-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1.5rem;
  padding: 0.75rem 1.25rem;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 50px;
}

.ai-banner-left {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.ai-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.35rem 0.75rem;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
  color: white;
  letter-spacing: 0.02em;
}

.ai-chip svg {
  opacity: 0.9;
}

.ai-banner-text {
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.85);
}

.audit-badge {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.4rem 0.9rem 0.4rem 0.5rem;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 24px;
  transition: background 0.2s ease;
}

.audit-badge:hover {
  background: rgba(255, 255, 255, 0.25);
}

.badge-shield {
  width: 28px;
  height: 28px;
}

.badge-info {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.badge-label {
  font-size: 0.7rem;
  font-weight: 600;
  color: white;
  line-height: 1.2;
}

.badge-verified {
  font-size: 0.65rem;
  color: rgba(255, 255, 255, 0.7);
  line-height: 1.2;
}

/* Notifications */
.notifications-container {
  position: fixed;
  top: 1.5rem;
  right: 1.5rem;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  max-width: 380px;
  width: 100%;
  pointer-events: none;
}

.notification {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.875rem 1rem;
  background: white;
  border-radius: 12px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(0, 0, 0, 0.05);
  pointer-events: auto;
  cursor: pointer;
  transition: all 0.2s ease;
}

.notification:hover {
  transform: translateX(-4px);
  box-shadow: 0 12px 48px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(0, 0, 0, 0.05);
}

.notification-icon {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.875rem;
  font-weight: 600;
  flex-shrink: 0;
}

.notification-info .notification-icon {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.notification-success .notification-icon {
  background: linear-gradient(135deg, #4ade80 0%, #22c55e 100%);
  color: white;
}

.notification-error .notification-icon {
  background: linear-gradient(135deg, #f87171 0%, #dc2626 100%);
  color: white;
}

.notification-message {
  flex: 1;
  font-size: 0.875rem;
  color: #333;
  line-height: 1.4;
}

.notification-close {
  background: none;
  border: none;
  font-size: 1.25rem;
  color: #999;
  cursor: pointer;
  padding: 0;
  line-height: 1;
  transition: color 0.2s;
}

.notification-close:hover {
  color: #666;
}

/* Notification animations */
.notification-enter-active {
  animation: slideIn 0.3s ease-out;
}

.notification-leave-active {
  animation: slideOut 0.3s ease-in;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateX(100%);
  }

  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes slideOut {
  from {
    opacity: 1;
    transform: translateX(0);
  }

  to {
    opacity: 0;
    transform: translateX(100%);
  }
}
</style>
