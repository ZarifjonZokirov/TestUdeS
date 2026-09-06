const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

// Insert global error handler right before export default app;
const errorHandlerCode = `
  // 9. Global Error Handler (Vercel debug uchun)
  app.use((err, req, res, next) => {
    console.error('GLOBAL ERROR:', err);
    res.status(500).json({
      error: 'Internal Server Error',
      message: err.message,
      stack: err.stack,
      path: req.path
    });
  });

  export default app;`;

code = code.replace(/export default app;/, errorHandlerCode);

// Add try catch to /api/auth/login and other top-level routes that don't have it
code = code.replace(/app\.post\('\/api\/auth\/login', \(req, res\) => \{/g, `app.post('/api/auth/login', (req, res, next) => {
    try {`);

code = code.replace(/res\.json\(\{\n\s*success: true,\n\s*user: \{\n\s*id: teacher\.id,\n\s*fullName: teacher\.fullName,\n\s*role: teacher\.role,\n\s*\}\n\s*\}\);\n\s*\}\);/g, `res.json({
      success: true,
      user: {
        id: teacher.id,
        fullName: teacher.fullName,
        role: teacher.role,
      }
    });
    } catch (e) {
      next(e);
    }
  });`);

fs.writeFileSync('server.ts', code);
console.log("Global error handler added to server.ts.");
