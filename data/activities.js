import { getAlgorithmTopic } from "./topics.js";
import { getEditorMethodConfig } from "./editor-methods.js";

/* Generadores de las 3x150 actividades - extraidos literalmente del original */
    export const BLOCK_ACTIVITIES = [];
    (function generate150Blocks() {
      for (let i = 1; i <= 150; i++) {
        const lvl = i <= 50 ? 'easy' : i <= 100 ? 'medium' : 'hard';
        const offset = i <= 50 ? i - 1 : i <= 100 ? i - 51 : i - 101;
        const meta = getAlgorithmTopic(lvl, offset);

        const lines = meta.code.split('\n');
        const palette = lines.map(line => ({ text: line.trim(), code: line.trim(), category: 'code' }));
        palette.push({ text: '// Comentario explicativo', code: '// Algoritmo ' + meta.name, category: 'code' });

        BLOCK_ACTIVITIES.push({
          id: i,
          level: lvl,
          funcName: meta.name,
          title_es: `${i}. ${meta.t_es}`,
          title_va: `${i}. ${meta.t_va}`,
          desc_es: meta.d_es,
          desc_va: meta.d_va,
          expected: meta.val,
          palette: palette
        });
      }
    })();

    export const PARSONS_ACTIVITIES = [];
    (function generate150Parsons() {
      for (let i = 1; i <= 150; i++) {
        const lvl = i <= 50 ? 'easy' : i <= 100 ? 'medium' : 'hard';
        const offset = i <= 50 ? i - 1 : i <= 100 ? i - 51 : i - 101;
        const meta = getAlgorithmTopic(lvl, offset);

        const lines = meta.code.split('\n').map(l => {
          let ind = 0;
          if (l.startsWith('    ') || l.startsWith('  ')) ind = 1;
          if (l.startsWith('        ') || l.startsWith('    ')) ind = 1;
          return { text: l.trim(), indent: ind };
        });

        const distractors = [
          { text: lines[0].text + ' ;', distractor: true },
          { text: 'return -999;', distractor: true }
        ];

        PARSONS_ACTIVITIES.push({
          id: i,
          level: lvl,
          funcName: meta.name,
          title_es: `${i}. ${meta.t_es}`,
          title_va: `${i}. ${meta.t_va}`,
          desc_es: `${meta.d_es} Ordena las sentencias en la secuencia correcta e indenta con [ + ] y [ - ].`,
          desc_va: `${meta.d_va} Ordena les sentències en la seqüència correcta i indenta amb [ + ] i [ - ].`,
          correctLines: lines,
          distractors: distractors
        });
      }
    })();

    export const EDITOR_ACTIVITIES = [];
    (function generate150Editor() {
      for (let i = 1; i <= 150; i++) {
        const lvl = i <= 50 ? 'easy' : i <= 100 ? 'medium' : 'hard';
        const offset = i <= 50 ? i - 1 : i <= 100 ? i - 51 : i - 101;
        const meta = getEditorMethodConfig(lvl, offset);

        const sig = `public static ${meta.sig}`;
        const defaultReturn = meta.ret === 'boolean' ? 'return false;' : meta.ret === 'String' ? 'return "";' : meta.ret === 'char' ? "return ' ';" : meta.ret === 'double' ? 'return 0.0;' : 'return 0;';

        const template = `public class Solucion {
    /**
     * ${meta.t_es}
     * ${meta.d_es}
     */
    ${sig} {
        // TODO: Implementa tu solución aquí:
        ${defaultReturn}
    }
}`;

        const fullOfficialSolution = `public class Solucion {
    /**
     * ${meta.t_es}
     * Solución oficial verificada
     */
    ${sig} {
        ${meta.javaBody.trim()}
    }
}`;

        EDITOR_ACTIVITIES.push({
          id: i,
          level: lvl,
          funcName: meta.name,
          title_es: `${i}. ${meta.t_es}`,
          title_va: `${i}. ${meta.t_va}`,
          desc_es: `${meta.d_es} Firma requerida: '${meta.sig}'.`,
          desc_va: `${meta.d_va} Signatura requerida: '${meta.sig}'.`,
          signature: meta.sig,
          template: template,
          officialSolution: fullOfficialSolution,
          evalBody: meta.body,
          tests: meta.tests
        });
      }
    })();
