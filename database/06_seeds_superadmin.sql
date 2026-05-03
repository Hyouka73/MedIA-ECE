-- 06_seeds_superadmin.sql
-- Seeds de usuarios base para el sistema MedSys ECE
-- Incluye SuperAdmin, OmniAdmin y perfiles operativos por defecto

-- 1. Persona para el Superadmin
INSERT INTO personas (id_persona, nombre, primer_apellido, segundo_apellido, curp, fecha_nacimiento, sexo)
VALUES (
    'c3d4e5f6-a7b8-4c9d-8e7f-0a1b2c3d4e5f',
    'ADMINISTRADOR',
    'SISTEMA',
    'CENTRAL',
    'ASCE800101HDFRRD01',
    '1980-01-01',
    'M'
);

-- 2. Personas para perfiles operativos adicionales
INSERT INTO personas (id_persona, nombre, primer_apellido, segundo_apellido, curp, fecha_nacimiento, sexo)
VALUES 
    ('f1a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b5c', 'ADMIN', 'OPERATIVO', 'LOCAL', 'AOL850101HDFRRD02', '1985-01-01', 'M'),
    ('f2a3b4c5-d6e7-4f8a-9b0c-1d2e3f4a5b6c', 'JUAN', 'MEDICO', 'GARCIA', 'JMG900101HDFRRD03', '1990-01-01', 'M'),
    ('f3a4b5c6-d7e8-4f9a-0b1c-2d3e4f5a6b7c', 'MARIA', 'ENFERMERA', 'LOPEZ', 'MEL920101MDFRRD04', '1992-01-01', 'F'),
    ('f4a5b6c7-d8e9-4f0a-1b2c-3d4e5f6a7b8c', 'ANA', 'RECEPCION', 'PEREZ', 'ARP950101MDFRRD05', '1995-01-01', 'F');

-- 3. Superadmin
INSERT INTO usuarios_sistema (id_usuario, id_persona, email, password_hash, id_rol, cedula_profesional, requires_2fa, activo)
VALUES (
    'b2c3d4e5-f6a7-4b5c-8d9e-0f1a2b3c4d5e',
    'c3d4e5f6-a7b8-4c9d-8e7f-0a1b2c3d4e5f',
    'superadmin@MedSys.local',
    '$argon2id$v=19$m=65536,t=3,p=4$OYeQEuJ8D+H83xuD0JqzVg$OjFreNfXV6jJdVMxiH5dE9oghuyJNYZMq7ndSPILK1M', -- MedSys2026!
    1, -- SUPERADMIN
    NULL,
    true, -- All users must configure 2FA on first login
    true
);

-- 4. Omniadmin
INSERT INTO usuarios_sistema (id_usuario, id_persona, email, password_hash, id_rol, cedula_profesional, requires_2fa, activo)
VALUES (
    'd4e5f6a7-b8c9-4d0e-9f8a-0b1c2d3e4f5a',
    'c3d4e5f6-a7b8-4c9d-8e7f-0a1b2c3d4e5f', -- Comparte la misma persona base o podríamos usar una nueva
    'omniadmin@MedSys.local',
    '$argon2id$v=19$m=65536,t=3,p=4$OYeQEuJ8D+H83xuD0JqzVg$OjFreNfXV6jJdVMxiH5dE9oghuyJNYZMq7ndSPILK1M', -- MedSys2026!
    9, -- OMNIADMIN
    NULL,
    true,
    true
);

-- 5. Perfiles Operativos Solicitados (requires_2fa = true para todos)
INSERT INTO usuarios_sistema (id_usuario, id_persona, email, password_hash, id_rol, cedula_profesional, requires_2fa, activo)
VALUES 
    -- Administrador
    ('a1b2c3d4-e5f6-4a1b-2c3d-4e5f6a7b8c9d', 'f1a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b5c', 'admin@MedSys.local', '$argon2id$v=19$m=65536,t=3,p=4$Ch6a+oCvSoQmPuGVTKnYWQ$ZsXBIZwlnE14HSPvsk0u7qm5sIsIUagebyHOoZrmRXs', 2, NULL, true, true),
    -- Medico
    ('c1e2d3c4-f5a6-4a1b-2c3d-4e5f6a7b8c9d', 'f2a3b4c5-d6e7-4f8a-9b0c-1d2e3f4a5b6c', 'medico_a@MedSys.local', '$argon2id$v=19$m=65536,t=3,p=4$+3BgOV6VbxASQ68m/rW4uA$UukJKFWpqvNjc5ZEmLnBXjJLeeaXFWVQ3vUAALYM+7k', 5, '12345678', true, true),
    -- Enfermeria
    ('e1b2c3d4-f5e6-4a1b-2c3d-4e5f6a7b8c9d', 'f3a4b5c6-d7e8-4f9a-0b1c-2d3e4f5a6b7c', 'enfermera@MedSys.local', '$argon2id$v=19$m=65536,t=3,p=4$LA2fHRfJvixOI4L+UEYHCQ$mQUr+9YgXF+BPvkVM5d0htF4ebOd/HJM6cLFXhGWrXA', 4, NULL, true, true),
    -- Recepcion
    ('b1e2c3e4-d5c6-4a1b-2c3d-4e5f6a7b8c9d', 'f4a5b6c7-d8e9-4f0a-1b2c-3d4e5f6a7b8c', 'recepcion@MedSys.local', '$argon2id$v=19$m=65536,t=3,p=4$P35CkmW9Pcv3+4OKxqB8jg$pN8jnaShTiaPbS7hHy0k165ptQL1pRHX9gq+8QNsuiE', 3, NULL, true, true);

-- 6. Asignar usuarios al establecimiento principal (CS Santa Ana - Chiapas)
INSERT INTO usuarios_establecimientos (id_usuario, id_establecimiento, es_principal)
VALUES 
    ('b2c3d4e5-f6a7-4b5c-8d9e-0f1a2b3c4d5e', 'e7eb6ece-9f20-4bf6-ab0e-6ed4d058abcb', true), -- SuperAdmin
    ('d4e5f6a7-b8c9-4d0e-9f8a-0b1c2d3e4f5a', 'e7eb6ece-9f20-4bf6-ab0e-6ed4d058abcb', true), -- OmniAdmin
    ('a1b2c3d4-e5f6-4a1b-2c3d-4e5f6a7b8c9d', 'e7eb6ece-9f20-4bf6-ab0e-6ed4d058abcb', true), -- Admin
    ('c1e2d3c4-f5a6-4a1b-2c3d-4e5f6a7b8c9d', 'e7eb6ece-9f20-4bf6-ab0e-6ed4d058abcb', true), -- Medico
    ('e1b2c3d4-f5e6-4a1b-2c3d-4e5f6a7b8c9d', 'e7eb6ece-9f20-4bf6-ab0e-6ed4d058abcb', true), -- Enfermera
    ('b1e2c3e4-d5c6-4a1b-2c3d-4e5f6a7b8c9d', 'e7eb6ece-9f20-4bf6-ab0e-6ed4d058abcb', true); -- Recepcion
