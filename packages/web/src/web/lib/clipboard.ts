/**
 * Due gesti che devono funzionare anche quando il browser li limita: copiare
 * un testo negli appunti e scaricarlo come file. Erano duplicati nel riquadro
 * del prompt e nel registro delle letture; vivono qui una volta sola, con lo
 * stesso ripiego.
 */

/**
 * Copia negli appunti; se `navigator.clipboard` manca (http non sicuro, permesso
 * negato) prova il vecchio `execCommand`. Restituisce `false` solo se entrambi
 * falliscono, così la vista può dire di copiare a mano.
 */
export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const area = document.createElement("textarea");
      area.value = text;
      area.setAttribute("readonly", "");
      area.style.position = "fixed";
      area.style.opacity = "0";
      document.body.append(area);
      area.select();
      const ok = document.execCommand("copy");
      area.remove();
      return ok;
    } catch {
      return false;
    }
  }
}

/** Scarica un testo come file: funziona anche dove gli appunti sono bloccati. */
export function downloadText(text: string, filename: string): void {
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.rel = "noopener";
  document.body.append(link);
  link.click();
  link.remove();
  // Safari annulla il download se l'URL viene revocato nello stesso tick.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
