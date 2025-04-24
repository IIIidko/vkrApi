-- Запрос на добавление или обновление строки в таблице
INSERT INTO verification_codes (email, code, valid_until, attempt_count)
VALUES ($1, $2, NOW() + INTERVAL '15 minutes', 0)
ON CONFLICT (email) DO UPDATE
SET code = EXCLUDED.code,
valid_until = EXCLUDED.valid_until,
attempt_count = EXCLUDED.attempt_count;