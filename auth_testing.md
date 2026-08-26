# MAPO — Auth Testing Playbook (Emergent Google Auth + JWT)

This app supports TWO auth methods, both returning a token used as `Authorization: Bearer <token>`:
1. Email/password (JWT) — `/api/auth/register`, `/api/auth/login`
2. Emergent Google OAuth — `/api/auth/session` (exchanges X-Session-ID for a session_token)

`get_current_user` accepts a Bearer token that is EITHER a JWT OR an Emergent session_token
(looked up in the `user_sessions` collection). Frontend stores the token in localStorage `mapo_token`.

## Simulating a Google session for testing (no real Google login needed)
```
mongosh --eval "
use('test_database');
var userId = null;
var email = 'g.test.' + Date.now() + '@example.com';
var r = db.users.insertOne({ email: email, name: 'Google Test', picture: 'https://x/y.png', role:'user', auth_provider:'google', profile:null, created_at: new Date().toISOString() });
var sessionToken = 'test_session_' + Date.now();
db.user_sessions.insertOne({ user_id: r.insertedId.toString(), session_token: sessionToken, expires_at: new Date(Date.now()+7*24*60*60*1000).toISOString(), created_at: new Date().toISOString() });
print('SESSION_TOKEN=' + sessionToken);
"
```
Then use it as a Bearer token:
```
curl -s $BASE/api/auth/me -H "Authorization: Bearer <SESSION_TOKEN>"        # returns user
curl -s $BASE/api/logs -H "Authorization: Bearer <SESSION_TOKEN>"           # protected route works
curl -s -X POST $BASE/api/auth/logout -H "Authorization: Bearer <SESSION_TOKEN>"  # deletes session
```

## Real OAuth UI flow
- Click "Continue with Google" (data-testid=google-signin-btn) → redirects to auth.emergentagent.com
- Returns to `{origin}/#session_id=...`; AuthContext POSTs `/api/auth/session` with header `X-Session-ID`,
  stores returned token, sets user, clears the hash.

## Cleanup
```
mongosh --eval "use('test_database'); db.users.deleteMany({email:/g\.test\./}); db.user_sessions.deleteMany({session_token:/test_session/});"
```
