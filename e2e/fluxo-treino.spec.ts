import { expect, test } from '@playwright/test';

// Fluxo principal offline-first: criar ficha → adicionar exercício →
// iniciar sessão → registrar série. Tudo sem backend (IndexedDB local).
test('cria ficha, adiciona exercício e registra uma série', async ({ page }) => {
  await page.goto('/treinos');

  await expect(page.getByRole('heading', { name: 'Minhas Fichas' })).toBeVisible();

  await page.getByRole('button', { name: 'Nova Ficha' }).click();
  await page.getByPlaceholder(/Nome da ficha/).fill('Treino A — E2E');
  await page.getByRole('button', { name: 'Criar ficha' }).click();

  await expect(page.getByRole('heading', { name: 'Treino A — E2E' })).toBeVisible();
  await page.getByRole('button', { name: 'Adicionar exercício' }).click();
  await page.getByPlaceholder(/Nome do exercício/).fill('Supino Reto');
  await page.getByRole('button', { name: 'Adicionar exercício' }).click();

  await page.getByRole('button', { name: 'Iniciar Treino' }).click();

  await expect(page.getByRole('heading', { name: 'Supino Reto' })).toBeVisible();
  await page.getByRole('button', { name: /Registrar Série 1/ }).click();

  // Após registrar, o timer de descanso substitui os inputs
  await expect(page.getByText('Descanso')).toBeVisible();
});
