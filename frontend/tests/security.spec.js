import { test, expect } from '@playwright/test';

const BASE_URL = "http://localhost:5173";

/**
 * Helper to perform login with 2FA
 * MedIA has a dev_bypass for "000000" code in non-prod environments
 */
async function login(page, email, password) {
  await page.goto(`${BASE_URL}/login`);
  
  // 1. Credentials Step
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button:has-text("Continuar")');

  // 2. 2FA Step - MedIA uses 6 individual inputs in OtpInput
  // Wait for the OTP inputs to appear
  await page.waitForSelector('input[inputmode="numeric"]', { timeout: 15000 });
  
  const bypassCode = "000000";
  const inputs = page.locator('input[inputmode="numeric"]');
  for (let i = 0; i < 6; i++) {
    await inputs.nth(i).type(bypassCode[i], { delay: 50 });
  }
  
  // The button text is "Verificar y entrar ✓"
  await page.click('button:has-text("Verificar")');

  // 3. Landing check
  await page.waitForURL('**/dashboard', { timeout: 20000 });
}

test.describe('MedIA Security Certification — Suite de Auditoría Forense', () => {

  test('Prueba A: Muro de Fuego (RBAC) - Rol ENFERMERIA', async ({ page }) => {
    await login(page, 'enfermera@media.local', 'Enfermera2026!');

    // 1. Verificación de UI Dinámica (Sidebar)
    const sidebar = page.locator('aside');
    await expect(sidebar).toContainText('Pacientes');
    await expect(sidebar).not.toContainText('Auditoría');
    await expect(sidebar).not.toContainText('Administración');

    // 2. Intento de Escalación de Privilegios vía URL (403 Enforcement)
    const forbiddenRoutes = [
      '/audit/logs',
      '/admin/usuarios'
    ];

    for (const route of forbiddenRoutes) {
      await page.goto(`${BASE_URL}${route}`);
      // El ProtectedRoute redirige a /403 si no hay permisos
      await page.waitForURL('**/403', { timeout: 5000 });
      await expect(page.locator('body')).toContainText('Acceso Denegado');
    }
  });

  test('Prueba B: Integridad NOM-004 (Inmutabilidad) - Rol MEDICO', async ({ page }) => {
    await login(page, 'medico_a@media.local', 'Medico2026!');
    
    // 1. Navegar a Pacientes
    await page.goto(`${BASE_URL}/pacientes`);
    
    // 2. Seleccionar primer paciente y abrir expediente
    await page.waitForSelector('table tbody tr', { timeout: 15000 });
    // El botón es "📋 Ver"
    await page.click('table tbody tr:nth-child(1) button:has-text("Ver")'); 
    
    // 3. Iniciar Nueva Consulta
    await page.waitForURL('**/expediente/**', { timeout: 15000 });
    await page.click('button:has-text("Nueva Consulta")');
    
    // Flujo de consulta (Paso 1: Motivo)
    await page.waitForSelector('textarea', { timeout: 10000 });
    await page.fill('textarea', 'Certificación de Inmutabilidad NOM-004');
    await page.click('button:has-text("Continuar")');
    
    // Paso 2: Diagnóstico
    await page.waitForSelector('input[placeholder*="diagnóstico"]', { timeout: 10000 });
    await page.fill('input[placeholder*="diagnóstico"]', 'E11'); 
    // Esperar a que aparezca el resultado del autocompletado
    await page.waitForSelector('div:has-text("E11")', { timeout: 10000 });
    await page.click('div:has-text("E11")');
    await page.click('button:has-text("Continuar")');
    
    // Paso 3: Exploración - Iniciar Consulta (Persistencia en DB)
    await page.waitForSelector('button:has-text("Iniciar Consulta")', { timeout: 10000 });
    await page.click('button:has-text("Iniciar Consulta")');
    
    // Paso 4: Plan y Cierre
    await page.waitForSelector('textarea', { timeout: 10000 });
    await page.fill('textarea', 'Prueba forense de bloqueo de edición post-cierre.');
    await page.click('button:has-text("Cerrar Encuentro")');
    
    // 4. Validar Inmutabilidad en el Historial
    await page.waitForURL('**/expediente/**', { timeout: 20000 });
    // Asegurarse de que estamos en la pestaña Encuentros
    await page.click('button:has-text("Encuentros")');
    
    // Buscar el badge de estado finalizado. El código usa "✓ finalizado" o similar
    const closedBadge = page.locator('span:has-text("finalizado")').first();
    await expect(closedBadge).toBeVisible({ timeout: 10000 });
    
    // Verificar que no haya botones de "Editar" o "Guardar" visibles para este encuentro
    // En el historial de encuentros, el encuentro finalizado no debería permitir edición
    await expect(page.locator('button:has-text("Guardar")')).not.toBeVisible();
  });

  test('Prueba C: Sanitización XSS (Input Sanitization) - Rol RECEPCIONISTA', async ({ page }) => {
    await login(page, 'recepcion@media.local', 'Recepcion2026!');
    
    // 1. Inyectar payload en registro de paciente
    await page.goto(`${BASE_URL}/pacientes/nuevo`);
    
    const xssPayload = '<img src=x onerror=console.error("XSS_DETECTED")>';
    const testLastName = `Audit-${Date.now()}`;
    
    // Usar placeholders exactos: "Ej. Juan" y "Ej. García"
    await page.fill('input[placeholder="Ej. Juan"]', xssPayload);
    await page.fill('input[placeholder="Ej. García"]', testLastName);
    await page.fill('input[type="date"]', '1990-05-15');
    
    // Intercepter errores de consola
    let xssExecuted = false;
    page.on('console', msg => {
      if (msg.text().includes('XSS_DETECTED')) xssExecuted = true;
    });

    // El botón es "Registrar"
    await page.click('button:has-text("Registrar")');
    
    // 2. Verificar renderizado seguro en la lista
    // Al registrar, redirige al expediente del nuevo paciente. Vamos de vuelta a la lista.
    await page.waitForURL('**/expediente/**', { timeout: 15000 }); 
    await page.goto(`${BASE_URL}/pacientes`);
    
    // Buscar por el apellido
    await page.waitForSelector('input[placeholder*="Buscar"]', { timeout: 10000 });
    await page.fill('input[placeholder*="Buscar"]', testLastName);
    
    // El payload debe verse como texto en la celda del nombre
    const nameCell = page.locator(`td:has-text("${testLastName}")`);
    await expect(nameCell).toBeVisible({ timeout: 10000 });
    
    // Verificar que el script no se ejecutó
    expect(xssExecuted).toBe(false);
  });

  test('Prueba D: Auditoría Forense y Trazabilidad - Rol ADMIN', async ({ page }) => {
    await login(page, 'admin@media.local', 'Admin2026!');
    
    await page.goto(`${BASE_URL}/audit/logs`);
    
    // 1. Verificar registros de auditoría
    // La tabla tiene cabeceras como "Timestamp", "Usuario", "IP", "Evento"
    await page.waitForSelector('table tr', { timeout: 15000 });
    const tableRows = page.locator('table tbody tr');
    expect(await tableRows.count()).toBeGreaterThan(0);
    
    // 2. Buscar evento de LOGIN reciente. La IP es 127.0.0.1
    // Buscamos en el texto de la tabla
    await expect(page.locator('table')).toContainText('LOGIN', { timeout: 10000 });
    await expect(page.locator('table')).toContainText('127.0.0.1', { timeout: 10000 }); 
  });

});
