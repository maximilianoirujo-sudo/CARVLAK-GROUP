-- ==============================================================================
-- CARVLAK GROUP - DATOS INICIALES Y PRUEBA (SEED)
-- ==============================================================================

-- Nota: Para vincular usuarios de auth con perfiles, en Supabase se usa el id del usuario creado en Authentication.
-- Este archivo inserta datos de demostración sobre clientes, vehículos, turnos y tareas.

-- Clientes
INSERT INTO public.clients (id, full_name, phone, email, cedula, origin, notes) VALUES
('11111111-1111-1111-1111-111111111111', 'Gonzalo Herosa', '093492241', 'gonzalo.herosa@gmail.com', '4.582.119-4', 'Instagram', 'Cliente interesado en permuta y tratamiento cerámico.'),
('22222222-2222-2222-2222-222222222222', 'Nicolás Varela', '099456789', 'nicolas.varela@hotmail.com', '3.912.845-1', 'WhatsApp', 'Particular muy detallista con su BMW.'),
('33333333-3333-3333-3333-333333333333', 'Camila Rodríguez', '098123456', 'camila.rod@gmail.com', '5.102.394-0', 'Presencial', 'Vino directamente al taller en Shangrilá.'),
('44444444-4444-4444-4444-444444444444', 'Martín Méndez', '091234890', 'martin.mendez@outlook.com', '4.201.789-3', 'Referido', 'Recomendado por Jonathan.');

-- Vehículos
INSERT INTO public.vehicles (id, plate, brand, model, year, color, mileage, category, ownership, client_id, photos) VALUES
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'SBX 1234', 'BMW', 'Serie 3 320i', 2021, 'Negro Metalizado', 38000, 'Mediano', 'client', '22222222-2222-2222-2222-222222222222', ARRAY['https://images.unsplash.com/photo-1555215695-3004980ad54e?w=800&auto=format&fit=crop']),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'AAT 8920', 'Toyota', 'Hilux SRX 4x4', 2022, 'Blanco Perlado', 54000, 'Pick-up', 'client', '44444444-4444-4444-4444-444444444444', ARRAY['https://images.unsplash.com/photo-1559416523-140ddc3d238c?w=800&auto=format&fit=crop']),
('cccccccc-cccc-cccc-cccc-cccccccccccc', 'BCA 5412', 'Volkswagen', 'Golf GTI 2.0 TSI', 2019, 'Gris Carbón', 62000, 'Chico', 'dealership', NULL, ARRAY['https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?w=800&auto=format&fit=crop']),
('dddddddd-dddd-dddd-dddd-dddddddddddd', 'SAY 7741', 'Jeep', 'Renegade Trailhawk', 2022, 'Rojo', 29000, 'SUV/Rural', 'client', '33333333-3333-3333-3333-333333333333', ARRAY['https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=800&auto=format&fit=crop']);

-- Historial vehicular inicial
INSERT INTO public.vehicle_history (vehicle_id, business, event_type, description) VALUES
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'detailing', 'tratamiento_ceramico', 'Aplicación de Coating Cerámico 3 Años y corrección de laca en dos pasos.'),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'inspeccion', 'inspeccion_ingreso', 'Peritaje completo en patio: 100% original de fábrica sin daño estructural.'),
('cccccccc-cccc-cccc-cccc-cccccccccccc', 'automotora', 'compra_stock', 'Ingreso al inventario de Carvlak Automotores para venta.');

-- Turnos en Agenda Unificada
INSERT INTO public.appointments (business, client_id, vehicle_id, start_time, duration_minutes, status, title, price_amount, price_currency, notes) VALUES
('detailing', '22222222-2222-2222-2222-222222222222', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', now() + interval '2 hours', 180, 'Confirmado', 'Tratamiento Cerámico Vidrio Líquido', 18500, 'UYU', 'Cliente llega a primera hora. Cuidar laca piano black.'),
('inspeccion', '11111111-1111-1111-1111-111111111111', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', now() + interval '5 hours', 45, 'Pendiente', 'Peritaje Rápido en Patio (Trade-in)', 2200, 'UYU', 'Revisar espesores de pintura en guardabarros trasero.'),
('automotora', '33333333-3333-3333-3333-333333333333', 'cccccccc-cccc-cccc-cccc-cccccccccccc', now() + interval '1 day', 60, 'Confirmado', 'Test Drive & Coordinación de Seña', 24500, 'USD', 'Interesada en financiación bancaria Santander 36 cuotas.');

-- Tareas
INSERT INTO public.tasks (title, description, business, due_date, status) VALUES
('Preparar producto cerámico Gyeon', 'Verificar stock de pads de pulido y sellador nanotecnológico.', 'detailing', CURRENT_DATE, 'En curso'),
('Revisión de títulos en escribanía para Golf GTI', 'Certificados de libre prenda y patente al día en SUCIVE.', 'automotora', CURRENT_DATE + 1, 'Pendiente'),
('Mantenimiento de densímetro y medidor de espesores', 'Calibrar sensor magnético para peritaje de patio.', 'inspeccion', CURRENT_DATE + 2, 'Pendiente');
