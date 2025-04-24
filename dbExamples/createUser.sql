-- Вставляем пример данных для обычного пользователя
INSERT INTO users (
    nickname,
    email,
    password,
    first_name,
    last_name,
    birth_date,
    role,
    last_login,
    status
) VALUES (
 'artlover92',                -- nickname
 'artlover92@example.com',    -- email
 '$2b$10$examplehash12345...', -- password (хешированный)
 'Иван',                      -- first_name
 'Петров',                    -- last_name
 '1992-05-15',                -- birth_date
 'user',                      -- role
 '2024-10-06 15:00:00',       -- last_login
 'active'                     -- status
);

-- Вставляем пример данных для администратора
INSERT INTO users (
    nickname,
    email,
    password,
    role,
    status
) VALUES (
 'admin123',                  -- nickname
 'admin123@example.com',      -- email
 '$2b$10$adminhash67890...',   -- password (хешированный)
 'admin',                     -- role
 'active'                     -- status
);