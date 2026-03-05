-- 03_seeds_geograficos.sql
-- Seeds geográficos (Estados y Municipios - Fragmento)
-- La carga completa de 124 municipios y localidades se hace con script Python.

-- 1. Especialidades Médicas (Requeridas por establecimientos)
INSERT INTO cat_especialidades_medicas (id_especialidad, nombre) VALUES
(1, 'Medicina General'),
(2, 'Ginecología y Obstetricia'),
(3, 'Pediatría'),
(4, 'Odontología'),
(5, 'Nutrición'),
(6, 'Psicología');

-- 2. Estados de México
INSERT INTO cat_estados (id_estado, nombre) VALUES
('01', 'Aguascalientes'), ('02', 'Baja California'), ('03', 'Baja California Sur'), ('04', 'Campeche'),
('05', 'Coahuila de Zaragoza'), ('06', 'Colima'), ('07', 'Chiapas'), ('08', 'Chihuahua'),
('09', 'Ciudad de México'), ('10', 'Durango'), ('11', 'Guanajuato'), ('12', 'Guerrero'),
('13', 'Hidalgo'), ('14', 'Jalisco'), ('15', 'México'), ('16', 'Michoacán de Ocampo'),
('17', 'Morelos'), ('18', 'Nayarit'), ('19', 'Nuevo León'), ('20', 'Oaxaca'),
('21', 'Puebla'), ('22', 'Querétaro'), ('23', 'Quintana Roo'), ('24', 'San Luis Potosí'),
('25', 'Sinaloa'), ('26', 'Sonora'), ('27', 'Tabasco'), ('28', 'Tamaulipas'),
('29', 'Tlaxcala'), ('30', 'Veracruz de Ignacio de la Llave'), ('31', 'Yucatán'), ('32', 'Zacatecas');

-- Fragmento de Municipios de Chiapas (124 en total, aquí 10 de ejemplo)
INSERT INTO cat_municipios (id_municipio, id_estado, nombre) VALUES
('07101', '07', 'Tuxtla Gutiérrez'),
('07078', '07', 'San Cristóbal de las Casas'),
('07089', '07', 'Tapachula'),
('07019', '07', 'Comitán de Domínguez'),
('07065', '07', 'Ocosingo'),
('07068', '07', 'Palenque'),
('07097', '07', 'Tonalá'),
('07106', '07', 'Venustiano Carranza'),
('07108', '07', 'Villaflores'),
('07027', '07', 'Chiapa de Corzo');

-- Fragmento de Localidades (Tuxtla Gutiérrez)
INSERT INTO cat_localidades (id_localidad, id_municipio, nombre, ambito) VALUES
('071010001', '07101', 'Tuxtla Gutiérrez', 'Urbano'),
('071010034', '07101', 'Copoya', 'Rural'),
('071010052', '07101', 'El Jobo', 'Rural');

-- Jurisdicciones Sanitarias de Chiapas
INSERT INTO jurisdicciones_sanitarias (id_jurisdiccion, num_jurisdiccion, nombre) VALUES
(1, 1, 'Tuxtla Gutiérrez'),
(2, 2, 'San Cristóbal de las Casas'),
(3, 3, 'Comitán de Domínguez'),
(4, 4, 'Villaflores'),
(5, 5, 'Pichucalco'),
(6, 6, 'Palenque'),
(7, 7, 'Tapachula'),
(8, 8, 'Tonalá'),
(9, 9, 'Ocosingo'),
(10, 10, 'Motozintla');

-- Establecimientos (Ejemplo: Centro de Salud Tuxtla)
INSERT INTO establecimientos (id_establecimiento, clues, nombre, id_jurisdiccion, id_localidad, nivel_atencion)
VALUES ('e7eb6ece-9f20-4bf6-ab0e-6ed4d058abcb', 'CSSSA023999', 'Centro de Salud Tuxtla Urbano I', 1, '071010001', 1);

-- Activando especialidades en ese centro
INSERT INTO establecimientos_especialidades (id_establecimiento, id_especialidad, activa)
VALUES ('e7eb6ece-9f20-4bf6-ab0e-6ed4d058abcb', 1, true), -- Med Gral
       ('e7eb6ece-9f20-4bf6-ab0e-6ed4d058abcb', 4, true); -- Odonto
