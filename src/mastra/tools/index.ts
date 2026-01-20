import { createTool } from '@mastra/core/tools';
import { ref } from 'process';
import { z } from 'zod';

// Hiring Agent tools 
// get-open-positions tool
export const getOpenPositionsTool = createTool({
  id: 'get-open-positions',
  description: 'Retrieve an open job positions from the company database by reference number',
  inputSchema: z.object({
    referenceNumber: z.string().describe('The reference number of the job position'),
    resume: z.string().describe('The candidate resume text'),
  }),
  outputSchema: z.object({
    jobDescription: 
      z.object({
        referenceNumber: z.string().describe('The reference number of the job position'),
        title: z.string().describe('The title of the job position'),
        department: z.string().describe('The department of the job position'),
        location: z.string().describe('The location of the job position'),
        description: z.string().describe('The description of the job position'),
      }),
      resume: z.string().describe('The candidate resume text'),
  }),
  execute: async ({ context }) => {
    return { jobDescription: await getOpenPositions(context.referenceNumber), resume: context.resume  };
  },
});

const getOpenPositions = async (referenceNumber?: string) => {
  const response = await fetch('http://localhost:8000/open-positions/' + (referenceNumber ? referenceNumber : 'REF123'));
  if (!response.ok) {
    throw new Error(`Error fetching open positions: ${response.statusText}`);
  }
  const data = await response.json();
  console.log('Fetched open positions:', data);

  return data;
};

// send evaluation 
export const sendEvaluationTool = createTool({
  id: 'send-evaluation',
  description: 'Send the candidate evaluation to the hiring manager',
  inputSchema: z.object({
    referenceNumber: z.string().describe('The job reference number'),
    evaluation: z.object({
      candidateName: z.string().describe('The name of the candidate'),
      score: z.number().describe('Suitability score from 0 to 100'),
      feedback: z.string().describe('Detailed feedback on the candidate\'s fit for the role'),
    }).describe('The candidate evaluation details'),
  }),
  outputSchema: z.object({
    success: z.boolean().describe('Indicates if the evaluation was sent successfully'),
    message: z.string().describe('Additional information about the sending process'),
  }),
  execute: async ({ context, tracingContext }) => {
    console.log('Trace ID in sendEvaluationTool:', tracingContext?.currentSpan?.traceId);
    return await sendEvaluation(context.referenceNumber, context.evaluation);
  },
});

const sendEvaluation = async (referenceNumber: string, evaluation: { candidateName: string; score: number; feedback: string }) => {
  // POST to api localhost:8000/submit-evaluation
  console.log(`Sending evaluation for reference number ${referenceNumber}:`, evaluation);
  const response = await fetch('http://localhost:8000/submit-evaluation', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      candidateName: evaluation.candidateName,
      referenceNumber: referenceNumber,
      score : evaluation.score,
      feedback: evaluation.feedback,
    }),
  });
  if (!response.ok) {
    throw new Error(`Error sending evaluation: ${response.statusText}`);
  }

  return {
    success: true,
    message: `Evaluation for reference number ${referenceNumber} sent successfully.`,
  };
};

