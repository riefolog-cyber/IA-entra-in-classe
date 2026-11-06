import asyncio
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True, executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
        page = await browser.new_page(viewport={'width': 1440, 'height': 1050})
        errors = []
        page.on('pageerror', lambda err: errors.append(str(err)))
        await page.goto('http://localhost:4200')
        await page.get_by_role('button', name='Inizia il percorso', exact=True).wait_for()
        await page.evaluate('localStorage.setItem("restare-umani-v1", JSON.stringify({answers:{"0-p0":"Risposta precedente da conservare"}, completed:[0],current:0,name:"Archivio"}))')
        await page.reload()
        await page.get_by_text('Le tue risposte precedenti sono conservate.').wait_for()
        async with page.expect_download() as old_download:
            await page.get_by_role('button', name='Esporta il percorso precedente').click()
        await (await old_download.value).save_as('/home/user/restare-previous-test.pdf')
        await page.get_by_role('button', name='Inizia il percorso', exact=True).click()
        assert await page.locator('textarea').nth(0).input_value() == '', 'Old responses must not be attached to new prompts'
        correct_answers = [1, 0, 2, 0, 1, 2]
        for i, correct in enumerate(correct_answers):
            await page.locator('.step-nav button').nth(i).click()
            await page.locator('textarea').nth(0).fill(f'Tappa {i+1}: obiettivo osservabile e ragionamento degli alunni, contesto inventato.')
            options = page.locator('fieldset.option-list button')
            await options.nth((correct+1)%3).click()
            await page.get_by_text('Un’occasione per approfondire.').wait_for()
            await options.nth(correct).click()
            await page.get_by_text('Hai individuato il concetto.').wait_for()
            await page.locator('.activity').nth(2).locator('.option-list button').nth(1).click()
            await page.locator('textarea').nth(1).fill('Discuto condizioni, limiti e rischi con un collega.')
            await page.get_by_role('button', name='Segna come conclusa').click()
        await page.get_by_role('button', name='Vai al riepilogo').click()
        await page.locator('main input').fill('Docente di prova')
        async with page.expect_download() as new_download:
            await page.get_by_role('button', name='Esporta il percorso in PDF').click()
        await (await new_download.value).save_as('/home/user/restare-teacher-test.pdf')
        stored = await page.evaluate('JSON.parse(localStorage.getItem("restare-umani-docenti-v2"))')
        assert len(stored['completed']) == 6 and len(stored['answers']) == 24
        assert 'Risposta precedente' in await page.evaluate('localStorage.getItem("restare-umani-v1")')
        await page.reload()
        await page.get_by_role('button', name='Riprendi il percorso', exact=True).wait_for()
        await page.get_by_role('button', name='Approfondimenti', exact=True).click()
        await page.get_by_role('textbox', name='Cerca nel glossario').fill('automation')
        assert await page.locator('.glossary details').count() == 1
        await page.locator('.glossary summary').click()
        text = await page.locator('body').inner_text()
        assert 'Per il docente' not in text and 'Fonti e trasparenza editoriale' not in text
        await page.get_by_role('button', name='Il tuo percorso', exact=True).click()
        await page.screenshot(path='/home/user/restare-teacher-desktop.png', full_page=True, animations='disabled')
        assert await page.evaluate('document.documentElement.scrollWidth <= innerWidth')
        await page.set_viewport_size({'width':390,'height':844})
        await page.screenshot(path='/home/user/restare-teacher-mobile.png', full_page=True, animations='disabled')
        assert await page.evaluate('document.documentElement.scrollWidth <= innerWidth')
        await page.get_by_role('button',name='Apri menu').click()
        await page.get_by_role('button',name='Cancella i miei dati').click()
        await page.get_by_role('button',name='Annulla',exact=True).click()
        assert 'Docente di prova' in await page.evaluate('localStorage.getItem("restare-umani-docenti-v2")')
        await page.get_by_role('button',name='Cancella i miei dati').click()
        await page.get_by_role('button',name='Cancella i dati',exact=True).click()
        assert await page.evaluate('localStorage.getItem("restare-umani-v1")') is None
        assert (await page.evaluate('JSON.parse(localStorage.getItem("restare-umani-docenti-v2"))'))['answers'] == {}
        assert not errors, errors
        print('PASS: six teacher activities, all quizzes/scenarios, persistence, PDFs, version isolation, glossary, responsive layout, deletion. No page errors.')
        await browser.close()

asyncio.run(main())