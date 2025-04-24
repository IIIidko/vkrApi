UPDATE users
SET last_login = CURRENT_TIMESTAMP
WHERE id = <user_id>;