import app from './app.js';
import { config } from './config.js';

app.listen(config.port, () => {
  console.log(`🚀 Server running at http://localhost:${config.port}`);
  console.log(`📊 API: http://localhost:${config.port}/api/students`);
  console.log(`📈 Stats: http://localhost:${config.port}/api/stats/overview`);
});
