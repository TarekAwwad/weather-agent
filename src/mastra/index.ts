import { Mastra } from '@mastra/core/mastra';
import { PinoLogger } from '@mastra/loggers';
import { weatherWorkflow } from './workflows';
import { hiringAgent } from './agents';
import { LibSQLStore } from '@mastra/libsql';

export const mastra = new Mastra({
  workflows: { weatherWorkflow },
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
