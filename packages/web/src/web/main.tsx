// Entry point referenced by index.html — composition only, real bootstrap
// lives in __main.tsx (template-managed).
// Prima di tutto il resto: se il bootstrap fallisce, questa rete scrive un
// messaggio leggibile al posto di una pagina bianca.
import "./boot-guard";
import "./register-service-worker";
import "./__main";
