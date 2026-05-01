-- 🚛 Logistics OS v1.0 - ბაზის სქემის ვერიფიკაცია
-- გაუშვი ეს სკრიპტი Supabase SQL Editor-ში

-- 🔍 vehicles ცხრილის სვეტები:
SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'vehicles' ORDER BY ordinal_position;
-- ⚠️ მოსალოდნელი ველები (UI-დან):
-- plate_number, vin_number, tech_passport, pti_expiry, insurance_policy, insurance_cmre_policy, owner_name, owner_type, model, type, body_type, capacity_kg, volume_m3, length_m, width_m, height_m, adr_class, euro_standard, has_tail_lift, straps_count, gps_device_id, has_fuel_sensor, photo_urls, tire_season, tire_condition, status, year_manufactured, mileage, fuel_type, color, last_service_date, next_service_date, insurance_expiry, notes

-- 🔍 drivers ცხრილის სვეტები:
SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'drivers' ORDER BY ordinal_position;
-- ⚠️ მოსალოდნელი ველები (UI-დან):
-- employment_type, full_name, dob, personal_id, phone, email, address, license_number, license_category, license_expiry, license_photo, criminal_record, driving_record, medical_cert, total_experience_years, special_experience, has_adr, adr_cert, has_own_vehicle, vehicle_reg, vehicle_insp_expiry, vehicle_insurance, bank_iban, tax_status, languages, references, uniform_size, photo_url, extra_skills, is_available, hire_date, daily_rate, emergency_contact

-- 🔍 orders ცხრილის სვეტები:
SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'orders' ORDER BY ordinal_position;
-- ⚠️ მოსალოდნელი ველები (UI-დან):
-- pickup_address, delivery_address, cargo_description, cargo_weight_kg, price, currency, client_name, client_email, client_address, notes, tracking_code, status, driver_type, vehicle_type, driver_id, external_driver_id, vehicle_id, external_vehicle_id, external_driver_rate, external_vehicle_rate, client_id

-- 🔍 private_clients ცხრილის სვეტები:
SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'private_clients' ORDER BY ordinal_position;
-- ⚠️ მოსალოდნელი ველები (UI-დან):
-- full_name, personal_id, phone, email, address, notes

-- 🔍 companies ცხრილის სვეტები:
SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'companies' ORDER BY ordinal_position;
-- ⚠️ მოსალოდნელი ველები (UI-დან):
-- name, registration_number, vat_number, contact_person, phone, email, legal_address, notes

-- 🔍 დუბლირებული ან ზედმეტი სვეტების ძიება:
SELECT column_name, count(*) as cnt FROM information_schema.columns WHERE table_schema = 'public' GROUP BY column_name HAVING count(*) > 1 ORDER BY cnt DESC;
