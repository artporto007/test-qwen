import { readFileSync, readdirSync } from "fs";
import { resolve } from "path";
import { describe, it, expect } from "vitest";

const respostaDir = resolve(process.cwd(), "resposta");

describe("Validação do arquivo HTML", () => {
  let htmlFiles = [];

  try {
    htmlFiles = readdirSync(respostaDir).filter(
      (file) => file.endsWith(".html") && !file.startsWith("."),
    );
  } catch (error) {
    // Pasta resposta não existe ou está vazia
  }

  // Teste 1: Exatamente um arquivo HTML
  it("deve ter exatamente um arquivo .html na pasta resposta", () => {
    expect(htmlFiles.length).toBe(
      1,
      `Esperado 1 arquivo .html, mas encontrados ${htmlFiles.length}. ` +
        `Arquivos encontrados: ${htmlFiles.join(", ") || "nenhum"}`,
    );
  });

  // Se não houver arquivos, pula os testes restantes
  if (htmlFiles.length !== 1) {
    return;
  }

  const file = htmlFiles[0];
  const filePath = resolve(respostaDir, file);
  let htmlContent;
  let parser;

  // Lê o conteúdo do arquivo
  try {
    htmlContent = readFileSync(filePath, "utf-8");
  } catch (error) {
    throw new Error(`Erro ao ler o arquivo ${file}: ${error.message}`);
  }

  // Parse do HTML
  try {
    parser = new DOMParser().parseFromString(htmlContent, "text/html");
  } catch (error) {
    throw new Error(`Erro ao parsear o HTML: ${error.message}`);
  }

  describe(`Arquivo: ${file}`, () => {
    // Teste 2: HTML válido (sem erros de parsing)
    it("deve ser um HTML válido (sem erros de parsing)", () => {
      const parserError = parser.querySelector("parsererror");
      expect(parserError).toBeNull();
    });

    // Teste 3: Estrutura básica do HTML
    it("deve conter estrutura básica do HTML (html, head, body)", () => {
      const htmlTag = parser.documentElement;
      const headTag = parser.head;
      const bodyTag = parser.body;

      expect(htmlTag).toBeDefined();
      expect(headTag).toBeDefined();
      expect(bodyTag).toBeDefined();
    });

    // Teste 4: DOCTYPE presente
    it("deve conter DOCTYPE html", () => {
      expect(htmlContent.toLowerCase()).toContain("<!doctype html>");
    });

    // Teste 5: Apenas H1 e P dentro do body
    it("deve conter apenas tags H1 e P dentro do body", () => {
      const body = parser.body;
      const children = Array.from(body.children);

      // Verifica se todos os filhos diretos são H1 ou P
      children.forEach((child, index) => {
        const tagName = child.tagName;
        expect(["H1", "P"]).toContain(
          tagName,
          `Tag inválida na posição ${index + 1}: <${tagName.toLowerCase()}>. ` +
            `Apenas <h1> e <p> são permitidos dentro do body.`,
        );
      });
    });

    // Teste 6: Pelo menos uma H1 e uma P
    it("deve conter pelo menos uma tag H1 e uma tag P", () => {
      const h1Tags = parser.querySelectorAll("h1");
      const pTags = parser.querySelectorAll("p");

      expect(h1Tags.length).toBeGreaterThanOrEqual(
        1,
        "Deve haver pelo menos uma tag <h1> no body",
      );
      expect(pTags.length).toBeGreaterThanOrEqual(
        1,
        "Deve haver pelo menos uma tag <p> no body",
      );
    });

    // Teste 7: Nenhuma outra tag além de H1 e P no body
    it("não deve conter outras tags além de H1 e P no body", () => {
      const body = parser.body;
      const allDescendants = Array.from(body.querySelectorAll("*"));

      allDescendants.forEach((descendant) => {
        const tagName = descendant.tagName;
        // Verifica se é H1 ou P, ou se é filho de H1/P (texto, spans, etc)
        const parent = descendant.parentElement;
        const isChildOfH1orP = parent && ["H1", "P"].includes(parent.tagName);

        if (!["H1", "P"].includes(tagName) && !isChildOfH1orP) {
          expect.fail(
            `Tag <${tagName.toLowerCase()}> não permitida. ` +
              `Apenas <h1> e <p> são permitidos diretamente no body.`,
          );
        }
      });
    });

    // Teste 8: HTML bem formado (tags fechadas)
    it("deve estar bem formado (tags fechadas corretamente)", () => {
      // Verifica se há tags mal formadas
      const body = parser.body;
      const serialized = body.innerHTML;

      // Verifica se há tags não fechadas (padrão simples)
      expect(serialized).not.toMatch(/<[^>]+$/);
    });

    // Teste 9: Verificação de conteúdo (não vazio)
    it("deve ter conteúdo nas tags H1 e P", () => {
      const h1Tags = parser.querySelectorAll("h1");
      const pTags = parser.querySelectorAll("p");

      h1Tags.forEach((h1, index) => {
        expect(h1.textContent.trim()).not.toBe(
          "",
          `Tag <h1> na posição ${index + 1} não pode estar vazia`,
        );
      });

      pTags.forEach((p, index) => {
        expect(p.textContent.trim()).not.toBe(
          "",
          `Tag <p> na posição ${index + 1} não pode estar vazia`,
        );
      });
    });
  });
});
