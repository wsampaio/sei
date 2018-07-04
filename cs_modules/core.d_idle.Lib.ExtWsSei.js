/**
 * Métodos não suportados no múdulo de webservice do sei:
 * core.d_idle.Lib.WsSei.js
 */

var ext_wsapi = {
  processo: {
    consultar: "procedimento_alterar",
    marcador: "andamento_marcador_gerenciar"
  }
}

function ext_ws_post(apirest, json_data) {

}

function ext_ws_get(apirest, params, id_url = null) {
  return __ProcessoGetUrlHashComandos(id_url).then(function (comandos) {
    var comando = comandos.reduce((acc, cur, i) => {
      if (cur.indexOf(apirest) != -1) acc = cur;
      return acc;
    });
    return fetch(comando, { method: 'GET' });
  }).then(function (response) {
    var contentType = response.headers.get("content-type");
    if (response.ok) {
      if (contentType && contentType.includes("text/html")) {
        return response.arrayBuffer();
      } else { console.log(contentType); throw new Error("Erro no Content Type esperado!"); }
    } else {
      throw new Error(response.statusText + ": " + response.status);
    }
  }).then(function (resp) {
    var resptx = new TextDecoder('ISO-8859-1').decode(resp);
    var $html = $($.parseHTML(resptx));
    switch (apirest) {
      case ext_wsapi.processo.consultar:
        return __ProcessoConsultar($html);
      default:
        throw new Error("Api não implementada");
    }
  });
}

/**
 * Retorna uma Promise com um Array com os links dos comandos relacionados ao processo.
 * @param {number} IdProcesso
 */
function __ProcessoGetUrlHashComandos(IdProcesso) {
  return new Promise((resolve, reject) => {
    var url = GetBaseUrl() + "controlador.php?acao=procedimento_trabalhar&id_procedimento=" + IdProcesso;
    if (IdProcesso == null) reject("IdProcesso não informado");
    fetch(url, { method: 'GET' }).then(function (response) {
      var contentType = response.headers.get("content-type");
      if (response.ok) {
        if (contentType && contentType.includes("text/html")) {
          return response.text();
        } else { console.log(contentType); throw new Error("Erro no Content Type esperado!"); }
      } else {
        throw new Error(response.statusText + ": " + response.status);
      }
    }).then(function (resp) {
      var $html = $($.parseHTML(resp));
      var linkArvore = $("#ifrArvore", $html).attr("src");
      if (linkArvore == undefined) throw new Error("Link da arvore não encontrado!");
      linkArvore = GetBaseUrl() + linkArvore;
      return fetch(linkArvore, { method: 'GET' }).then(function (response) {
        var contentType = response.headers.get("content-type");
        if (response.ok) {
          if (contentType && contentType.includes("text/html")) {
            return response.text();
          } else { console.log(contentType); throw new Error("Erro no Content Type esperado!"); }
        } else {
          throw new Error(response.statusText + ": " + response.status);
        }
      })
    }).then(function (resp) {
      var x = resp.indexOf("Nos[0].acoes");
      x = resp.indexOf("'", x) + 1;
      var y = resp.indexOf("Nos[0]", x) - 3;
      var $html = $($.parseHTML(resp.substring(x, y)));
      var linkArray = [];
      $html.each(function (i, tag) {
        var href = $(tag).attr("href");
        if (href != "#") linkArray.push(GetBaseUrl() + href);
      });
      if (linkArray.length > 0) {
        resolve(linkArray);
      } else {
        throw new Error("Link de comandos do processo não encontrado.");
      }
    }).catch(reject);
  });
}

/**
 * Consulta os dados do processo (Tela alterar processo)
 * @param {*} $html
 */
function __ProcessoConsultar($html) {
  return new Promise((resolve, reject) => {
    var Processo = {
      IdProcedimento: -1,
      ProtocoloProcedimentoFormatado: "",
      NomeTipoProcedimento: "",
      /** Novos */
      Numero: "",
      DataAutuacao: null,
      Tipo: "",
      Especificacao: "",
      Interessados: [],
      Observacao: "",
      NivelAcesso: -1,
      HipoteseLegal: null
    }
    Processo.IdProcedimento = $("#hdnIdProcedimento", $html).val();
    Processo.ProtocoloProcedimentoFormatado = $("#hdnProtocoloProcedimentoFormatado", $html).val();
    Processo.NomeTipoProcedimento = $("#hdnNomeTipoProcedimento", $html).val();
    Processo.Numero = Processo.ProtocoloProcedimentoFormatado.replace(/\D/g, "");
    Processo.DataAutuacao = $("#txtDtaGeracaoExibir", $html).val();
    Processo.Tipo = Processo.NomeTipoProcedimento;
    Processo.Especificacao = $("#txtDescricao", $html).val();
    $("#selInteressadosProcedimento > option", $html).each(function name(params) {
      Processo.Interessados.push($(this).text());
    })
    Processo.Observacao = $("#txaObservacoes", $html).text();
    Processo.NivelAcesso = $("input[name='rdoNivelAcesso'][checked]", $html).val();
    if (Processo.NivelAcesso == 1) {
      var Acesso = { nome: "", valor: -1 };
      var $acesso = $("#selHipoteseLegal option[selected]", $html);
      Acesso.nome = $acesso.text();
      Acesso.valor = $acesso.val();
      Processo.HipoteseLegal = Acesso;
    }
    resolve(Processo);
  });
}


