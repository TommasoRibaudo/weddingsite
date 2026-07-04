import { chromium } from '@playwright/test';
import path from 'path';
import fs from 'fs';

const BASE = 'http://127.0.0.1:3000';
const AUTH_DIR = path.join('tests', 'e2e', '.auth');

async function loginAsGuest(password: string, name: string, statePath: string) {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto(BASE + '/');
  await page.getByLabel('Contraseña').fill(password);
  await page.getByRole('button', { name: 'Continuar' }).click();
  await page.getByLabel('Tu nombre').fill(name);
  await page.getByRole('button', { name: 'Ver nuestra celebración' }).click();
  await page.waitForURL('**/home');
  await page.context().storageState({ path: statePath });
  await browser.close();
}

async function loginAsAdmin(password: string, statePath: string) {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto(BASE + '/tomma/bobba/login');
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Log in' }).click();
  await page.waitForURL('**/tomma/bobba');
  await page.context().storageState({ path: statePath });
  await browser.close();
}

export default async function globalSetup() {
  const guestPassword = process.env.TEST_GUEST_PASSWORD;
  const adminPassword = process.env.TEST_ADMIN_PASSWORD;

  if (!guestPassword || !adminPassword) {
    throw new Error(
      'TEST_GUEST_PASSWORD and TEST_ADMIN_PASSWORD must be set in .env.local',
    );
  }

  fs.mkdirSync(AUTH_DIR, { recursive: true });

  await loginAsGuest(guestPassword, 'TestGuest', path.join(AUTH_DIR, 'guest.json'));
  await loginAsGuest(guestPassword, 'TestGuest2', path.join(AUTH_DIR, 'guest2.json'));
  await loginAsAdmin(adminPassword, path.join(AUTH_DIR, 'admin.json'));
}
