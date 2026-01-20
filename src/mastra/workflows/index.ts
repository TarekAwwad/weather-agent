import { Agent } from '@mastra/core/agent';
import { createStep, createWorkflow } from '@mastra/core/workflows';
import { z } from 'zod';
import { getOpenPositionsTool, sendEvaluationTool } from '../tools';
import { get } from 'http';

const agent = new Agent({
    name: 'Hiring Agent',
    model: process.env.MODEL || 'openai/gpt-4o',
    instructions: `  
      You are a hiring assistant working for a recruitment agency that supports companies in screening and selecting top talent. You interact exclusively with candidates in a public-facing role. Your objective is to gather the necessary information and assist in evaluating candidates, while maintaining strict confidentiality regarding internal assessments and notes.

      Your responsibilities:
      Use the job reference number to retrieve the relevant job description and internal notes.
      Perform an internal evaluation by comparing the candidate’s resume against the job description.
 
      Generate:
      A suitability score (0 to 100)
      A detailed internal assessment outlining strengths, weaknesses, and potential red flags

      Always call the anchor-trace-tool at the beginning and end of each interaction.
      Use the get-open-positions tool to retrieve job positions by reference number.  
      Use the send-evaluation tool to send your evaluation to the hiring manager
      Strictly reply with the following JSON structure: 
      {candidateName, referenceNumber, score, feedback}.
 `,
});


const getOpenPositions = createStep(getOpenPositionsTool);
const sendEvaluation = createStep(sendEvaluationTool);
const evaluateCandidate = createStep({
    id: 'evaluate-candidate',
    description: 'Evaluate the candidate based on the job description and resume',
    inputSchema: z.object({
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
    outputSchema: z.object({
        referenceNumber: z.string().describe('The job reference number'),
        evaluation: z.object({
            candidateName: z.string().describe('The name of the candidate'),
            score: z.number().describe('Suitability score from 0 to 100'),
            feedback: z.string().describe('Detailed feedback on the candidate\'s fit for the role'),
        }).describe('The candidate evaluation details'),
    }),
    execute: async ({ inputData }) => {
        console.log('Evaluating candidate for job:', inputData.jobDescription.referenceNumber);
        
        // CaLLing the agent to evaluate
        const evaluationResponse = await agent.generate(`
          Based on the following job description and candidate resume, provide:
          1. A suitability score from 0 to 100.
          2. Detailed feedback on the candidate's fit for the role.
            Job Description: ${JSON.stringify(inputData.jobDescription)}
            Candidate Resume: ${inputData.resume}
        `);

        console.log('Agent evaluation response:', evaluationResponse.text);

        // Parse the agent's response (assuming it's in JSON format)
        const evaluationData = JSON.parse(evaluationResponse.text);
        const candidateName = evaluationData.candidateName || 'Unknown Candidate';
        const score = evaluationData.score || 0;
        const feedback = evaluationData.feedback || 'No feedback provided';

        return { referenceNumber: inputData.jobDescription.referenceNumber, evaluation: { candidateName, score, feedback } };
    },
});


const evaluationWorkflow = createWorkflow({
    id: 'evaluation-workflow',
    inputSchema: z.object({
        referenceNumber: z.string().describe('The job reference number'),
        resume: z.string().describe('The candidate resume text'),
    }),
    outputSchema: z.object({
        activities: z.string(),
    }),
})
    .then(getOpenPositions)
    .then(evaluateCandidate)
    .then(sendEvaluation);

evaluationWorkflow.commit();

export { evaluationWorkflow };


// curl --location 'http://localhost:4111/api/workflows/myWorkflow/run' --header 'Content-Type: application/json'
// curl -X POST --location 'http://localhost:4111/api/workflows/myWorkflow/run' --header 'Content-Type: application/json' --data '{ "city": "New York" }'