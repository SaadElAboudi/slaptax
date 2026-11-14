// Test processes must never inherit a production database or deployment lease.
delete process.env.DATABASE_URL;
delete process.env.RENDER_SERVICE_ID;
process.env.NODE_ENV = 'test';
delete process.env.APP_DISTRIBUTION;
