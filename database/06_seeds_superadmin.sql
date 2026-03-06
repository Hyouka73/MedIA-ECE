-- 06_seeds_superadmin.sql
-- Seed de usuario SUPERADMIN inicial
-- Hash Argon2id precargado para MedIA2026! 
-- (NOTA: En producción, forcezar cambio de clave en 1er login)

-- 1. Crear a la persona física del admin
INSERT INTO personas (id_persona, nombre, primer_apellido, segundo_apellido, curp, fecha_nacimiento, sexo)
VALUES (
    'a1b2c3d4-e5f6-4a5b-8c7d-9e0f1a2b3c4d',
    'Root',
    'Administrador',
    'Seguridad',
    NULL,
    '1990-01-01',
    'X'
);

-- 2. Crear al usuario asociado con ROL SUPERADMIN (Rol = 1)
INSERT INTO usuarios_sistema (id_usuario, id_persona, email, password_hash, id_rol, cedula_profesional, requires_2fa, activo)
VALUES (
    'b2c3d4e5-f6a7-4b5c-8d9e-0f1a2b3c4d5e',
    'a1b2c3d4-e5f6-4a5b-8c7d-9e0f1a2b3c4d',
    'baka637472@gmail.com',
    '$argon2id$v=19$m=65536,t=3,p=4$OYeQEuJ8D+H83xuD0JqzVg$OjFreNfXV6jJdVMxiH5dE9oghuyJNYZMq7ndSPILK1M', -- MedIA2026!
    1, -- SUPERADMIN ID
    NULL,
    true, -- TEST: Enable 2FA for SuperAdmin
    true
);

-- 4. Crear a la persona del OmniAdmin
INSERT INTO personas (id_persona, nombre, primer_apellido, segundo_apellido, curp, fecha_nacimiento, sexo)
VALUES (
    'c3d4e5f6-a7b8-4c9d-8e7f-0a1b2c3d4e5f',
    'Omni',
    'Admin',
    'Universal',
    NULL,
    '1985-05-05',
    'X'
);

-- 5. Crear al usuario OMNIADMIN (Rol = 9)
INSERT INTO usuarios_sistema (id_usuario, id_persona, email, password_hash, id_rol, cedula_profesional, requires_2fa, activo)
VALUES (
    'd4e5f6a7-b8c9-4d0e-9f8a-0b1c2d3e4f5a',
    'c3d4e5f6-a7b8-4c9d-8e7f-0a1b2c3d4e5f',
    'omniadmin@media.local',
    '$argon2id$v=19$m=65536,t=3,p=4$OYeQEuJ8D+H83xuD0JqzVg$OjFreNfXV6jJdVMxiH5dE9oghuyJNYZMq7ndSPILK1M', -- MedIA2026!
    9, -- OMNIADMIN
    NULL,
    false, -- No 2FA for OmniAdmin (as requested for fast bypass)
    true
);

-- 6. Asignar Omniadmin al establecimiento principal
INSERT INTO usuarios_establecimientos (id_usuario, id_establecimiento, es_principal)
VALUES ('d4e5f6a7-b8c9-4d0e-9f8a-0b1c2d3e4f5a', 'e7eb6ece-9f20-4bf6-ab0e-6ed4d058abcb', true);

-- 7. Asignar el Superadmin al establecimiento principal
INSERT INTO usuarios_establecimientos (id_usuario, id_establecimiento, es_principal)
VALUES ('b2c3d4e5-f6a7-4b5c-8d9e-0f1a2b3c4d5e', 'e7eb6ece-9f20-4bf6-ab0e-6ed4d058abcb', true);
