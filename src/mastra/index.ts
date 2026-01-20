import { Mastra } from '@mastra/core/mastra';
import { PinoLogger } from '@mastra/loggers';
import { hiringAgent } from './agents';
import { LibSQLStore } from '@mastra/libsql';
import { evaluationWorkflow } from './workflows';

export const mastra = new Mastra({
  workflows: { evaluationWorkflow },
  agents: { hiringAgent },
  logger: new PinoLogger({
    name: 'Mastra',
    level: 'info',
  }),
  storage: new LibSQLStore({
    url: "file:./mastra.db",
  }),
  observability: {
    default: {
      enabled: true,
    },
  },
});
