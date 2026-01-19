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
  }),
  outputSchema: z.object({
    positions: z.array(
      z.object({
        referenceNumber: z.string().describe('The reference number of the job position'),
        title: z.string().describe('The title of the job position'),
        department: z.string().describe('The department of the job position'),
        location: z.string().describe('The location of the job position'),
        description: z.string().describe('The description of the job position'),
      })
    ).describe('List of open job positions'),

  }),
  execute: async ({ context }) => {
    return await getOpenPositions(context.referenceNumber);
  },
});

const getOpenPositions = async (referenceNumber?: string) => {
  // api localhost:8000/open-positions/{reference_number}
  const response = await fetch('http://localhost:8000/open-positions/' + (referenceNumber ? referenceNumber : 'REF123'));
  if (!response.ok) {
    throw new Error(`Error fetching open positions: ${response.statusText}`);
  }
  const data = await response.json();
  console.log('Fetched open positions:', data);

  return data;
};

// evaluate-candidate tool
export const evaluateCandidateTool = createTool({
  id: 'evaluate-candidate',
  description: 'Evaluate a job candidate based on their resume and job description',
  inputSchema: z.object({
    resume: z.string().describe('The candidate\'s resume'),
    // jobDescription: z.string().describe('The job description for the position'),
    referenceNumber: z.string().describe('The job reference number to fetch the job description'),
  }),
  outputSchema: z.object({
    score: z.number().describe('Suitability score from 0 to 100'),
    feedback: z.string().describe('Detailed feedback on the candidate\'s fit for the role'),
  }),
  execute: async ({ context }) => {

    const jobPositions = await getOpenPositions(context.referenceNumber);
    if (!jobPositions || jobPositions.length === 0) {
      throw new Error(`No job position found for reference number: ${context.referenceNumber}`);
    }
    return await evaluateCandidate(context.resume, jobPositions[0].description);
  },
});

const evaluateCandidate = async (resume: string, jobDescription: string) => {
  // Placeholder logic for candidate evaluation
  // In a real implementation, this could involve NLP models or external services
  const score = Math.floor(Math.random() * 101); // Random score between 0 and 100
  const feedback = `Based on the provided resume and job description, the candidate has been evaluated with a score of ${score}. Further analysis is recommended for a comprehensive assessment.`;

  return {
    score,
    feedback,
  };
};