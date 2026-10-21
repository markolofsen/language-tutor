// Test deployment: the secrets and origin a real one takes from the environment.
process.env.APP_PASSWORD = "test-password";
process.env.APP_SECRET = "test-secret-0123456789abcdef0123456789abcdef";
process.env.MCP_TOKEN = "test-mcp-token";
process.env.APP_URL = "https://tutor.example";
