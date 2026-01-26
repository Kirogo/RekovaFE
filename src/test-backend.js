// Run this in browser console to test
async function testBackend() {
  try {
    console.log('Testing backend connection...');
    const health = await fetch('http://localhost:5000/health');
    console.log('Health check:', await health.json());
    
    const login = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'staff', password: 'password123' })
    });
    console.log('Login test:', await login.json());
  } catch (err) {
    console.error('Test failed:', err);
  }
}
testBackend();