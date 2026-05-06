BEGIN;

UPDATE usuarios_sistema 
SET requires_2fa = false 
WHERE email IN (
    'superadmin@MedSys.local',
    'omniadmin@MedSys.local',
    'medico_a@MedSys.local',
    'medico_b@MedSys.local',
    'enfermera@MedSys.local',
    'recepcion@MedSys.local'
);

COMMIT;
