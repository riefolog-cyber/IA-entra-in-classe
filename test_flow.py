import asyncio
import os
import tempfile
from pathlib import Path
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True, args=['--no-sandbox'])
        page = await browser.new_page(viewport={'width': 1440, 'height': 1000})
        errors = []
        page.on('pageerror', lambda err: errors.append(str(err)))
        await page.goto('http://localhost:4200')
        await page.get_by_role('button', name='Inizia il percorso', exact=True).click()
        await page.get_by_role('heading', name='Il mio specchio digitale', exact=True).wait_for()
        await page.locator('textarea').nth(0).fill('Uso l’IA per trovare idee, ma verifico le fonti. Riflessione di prova.')
        await page.get_by_role('button', name='Sì, la sicurezza del tono indica precisione.').click()
        await page.get_by_text('Un’occasione per approfondire.').wait_for()
        await page.get_by_role('button', name='No, bisogna verificare contenuto e fonti.').click()
        await page.get_by_text('Hai individuato il concetto.').wait_for()
        await page.get_by_role('button', name='Controlliamo le affermazioni e dichiariamo come abbiamo usato l’IA.').click()
        await page.locator('textarea').nth(1).fill('Scelgo trasparenza e controllo, ascoltando il gruppo.')
        await page.get_by_role('button', name='Segna come conclusa').click()
        await page.reload()
        await page.get_by_role('button', name='Riprendi il percorso').click()
        assert await page.locator('textarea').nth(0).input_value() == 'Uso l’IA per trovare idee, ma verifico le fonti. Riflessione di prova.'
        await page.get_by_role('button', name='Vai al riepilogo').click()
        await page.locator('main input').fill('Studente di prova')
        async with page.expect_download() as download_info:
            await page.get_by_role('button', name='Esporta il percorso in PDF').click()
        download = await download_info.value
        pdf_path = os.path.join(tempfile.gettempdir(), 'restare-test.pdf')
        await download.save_as(pdf_path)
        assert os.path.getsize(pdf_path) > 10000
        await page.get_by_role('button', name='Approfondimenti', exact=True).click()
        await page.get_by_role('textbox', name='Cerca nel glossario').fill('automation')
        assert await page.locator('.glossary details').count() == 1
        await page.locator('.glossary summary').click()
        await page.get_by_text('Tendenza ad attribuire eccessiva fiducia', exact=False).wait_for()
        await page.set_viewport_size({'width': 390, 'height': 844})
        await page.get_by_role('button', name='Apri menu').click()
        await page.get_by_role('button', name='Il tuo percorso', exact=True).click()
        assert await page.evaluate('document.documentElement.scrollWidth <= innerWidth'), 'Mobile horizontal overflow'
        await page.wait_for_function("!document.querySelector('.sidebar').classList.contains('mobile-open') && getComputedStyle(document.querySelector('.sidebar')).transform.includes('-265')")
        await page.screenshot(path=os.path.join(tempfile.gettempdir(), 'restare-mobile.png'), full_page=True, animations='disabled')
        await page.get_by_role('button', name='Apri menu').click()
        await page.get_by_role('button', name='Cancella i miei dati').click()
        await page.get_by_role('button', name='Annulla', exact=True).click()
        assert 'Riflessione di prova' in (await page.evaluate('localStorage.getItem("restare-umani-v1")'))
        await page.get_by_role('button', name='Cancella i miei dati').click()
        await page.get_by_role('button', name='Cancella i dati', exact=True).click()
        stored = await page.evaluate('JSON.parse(localStorage.getItem("restare-umani-v1"))')
        assert stored['answers'] == {} and stored['completed'] == [] and stored['name'] == ''
        assert not errors, errors
        print('PASS: quiz feedback, scenarios, diary, persistence, completion, PDF download, glossary search, mobile layout, delete/cancel; no browser errors.')
        await browser.close()

asyncio.run(main())