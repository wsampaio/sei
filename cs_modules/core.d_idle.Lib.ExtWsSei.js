/**
 * Métodos não suportados no múdulo de webservice do sei:
 * core.d_idle.Lib.WsSei.js
 */

var ext_wsapi = {
  processo: {
    consultar: "__ProcessoConsultar",
    consultar_dados: "procedimento_alterar",
    marcador: "andamento_marcador_gerenciar"
  }
}

function ext_ws_post(apirest, json_data) {

}

function ext_ws_get(apirest, params = null, id_url = null) {
  if (apirest == ext_wsapi.processo.consultar) {
    return __ProcessoConsultar(id_url);
  } else if (params != null) {
    if (params.__tipo != null) {
      return Promise.resolve(params.LinkComandos).then(function (comandos) {
        var comando = comandos.reduce((acc, cur, i) => {
          if (cur.indexOf(apirest) != -1) acc = cur;
          return acc;
        });
        return fetch(comando, { method: 'GET' });
      }).then(function (response) {
        var contentType = response.headers.get("content-type");
        if (response.ok) {
          if (contentType && contentType.includes("text/html")) {
            return response.arrayBuffer().then(buf => new TextDecoder('ISO-8859-1').decode(buf));
          } else { console.log(contentType); throw new Error("Erro no Content Type esperado!"); }
        } else {
          throw new Error(response.statusText + ": " + response.status);
        }
      }).then(function (resp) {
        var $html = $($.parseHTML(resp));
        switch (apirest) {
          case ext_wsapi.processo.consultar_dados:
            return __ProcessoConsultarDados($html);
          default:
            throw new Error("Api não implementada");
        }
      });
    }
  } else {
    return Promise.reject("ext_ws_get: Parametros inválidos");
  }
}

/**
 * Retorna JSON com os dados e comandos do processo.
 * @param {number} IdProcesso
 */
function __ProcessoConsultar(IdProcesso) {
  return new Promise((resolve, reject) => {
    var url = GetBaseUrl() + "controlador.php?acao=procedimento_trabalhar&id_procedimento=" + IdProcesso;
    var Processo = {
      __tipo: "processo",
      id: IdProcesso,
      Numero: -1,
      Flags: {
        Restrito: false,
        PontoControle: null,
        Marcador: {
          Nome: null,
          Cor: null,
        },
      },
      LinkComandos: [],
    };

    if (IdProcesso == null) reject("IdProcesso não informado");
    fetch(url, { method: 'GET' }).then(function (response) {
      var contentType = response.headers.get("content-type");
      if (response.ok) {
        if (contentType && contentType.includes("text/html")) {
          return response.arrayBuffer().then(buf => new TextDecoder('ISO-8859-1').decode(buf));
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
            return response.arrayBuffer().then(buf => new TextDecoder('ISO-8859-1').decode(buf));
          } else { console.log(contentType); throw new Error("Erro no Content Type esperado!"); }
        } else {
          throw new Error(response.statusText + ": " + response.status);
        }
      });
    }).then(function (resp) {
      /** Pega os links dos camandos do processo */
      var x = resp.indexOf("Nos[0].acoes");
      x = resp.indexOf("'", x) + 1;
      var y = resp.indexOf("Nos[0]", x) - 3;
      var $html = $($.parseHTML(resp.substring(x, y)));
      $html.each(function (i, tag) {
        var href = $(tag).attr("href");
        if (href != "#") Processo.LinkComandos.push(GetBaseUrl() + href);
      });
      if (Processo.LinkComandos.length < 1) {
        throw new Error("Link de comandos do processo não encontrado.");
      }
      /** Pega as ações flags do processo */
      x = resp.indexOf('infraArvoreAcao("NIVEL_ACESSO'); /** ACESSO RESTRITO */
      if (x != -1) {
        Processo.Flags.Restrito = true;
      }
      x = resp.indexOf('infraArvoreAcao("SITUACAO'); /** PONTO DE CONTROLE */
      if (x != -1) {
        x = resp.indexOf("Ponto de Controle\\n", x) + 19;
        y = resp.indexOf('"', x);
        Processo.Flags.PontoControle = resp.substring(x, y);
      }
      x = resp.indexOf('infraArvoreAcao("MARCADOR'); /** MARCADOR */
      if (x != -1) {
        x = resp.indexOf("Marcador\\n", x) + 10;
        y = resp.indexOf('"', x);
        Processo.Flags.Marcador.Nome = resp.substring(x, y);
        x = resp.indexOf('_', y) + 1;
        y = resp.indexOf('.png', x);
        Processo.Flags.Marcador.Cor = resp.substring(x, y);
      }
      /** Pega o número do processo */
      x = resp.indexOf("Nos[0].acoes") - 30;
      x = resp.indexOf('"', x) + 1;
      y = resp.indexOf('"', x);
      Processo.Numero = resp.substring(x, y);

      resolve(Processo);
    }).catch(reject);
  });
}

/**
 * Consulta os dados do processo (Tela alterar processo)
 * @param {*} $html
 */
function __ProcessoConsultarDados($html) {
  return new Promise((resolve, reject) => {
    var DadosProcesso = {
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
    DadosProcesso.IdProcedimento = $("#hdnIdProcedimento", $html).val();
    DadosProcesso.ProtocoloProcedimentoFormatado = $("#hdnProtocoloProcedimentoFormatado", $html).val();
    DadosProcesso.NomeTipoProcedimento = $("#hdnNomeTipoProcedimento", $html).val();
    DadosProcesso.Numero = DadosProcesso.ProtocoloProcedimentoFormatado.replace(/\D/g, "");
    DadosProcesso.DataAutuacao = $("#txtDtaGeracaoExibir", $html).val();
    DadosProcesso.Tipo = DadosProcesso.NomeTipoProcedimento;
    DadosProcesso.Especificacao = $("#txtDescricao", $html).val();
    $("#selInteressadosProcedimento > option", $html).each(function name(params) {
      DadosProcesso.Interessados.push($(this).text());
    })
    DadosProcesso.Observacao = $("#txaObservacoes", $html).text();
    DadosProcesso.NivelAcesso = $("input[name='rdoNivelAcesso'][checked]", $html).val();
    if (DadosProcesso.NivelAcesso == 1) {
      var Acesso = { nome: "", valor: -1 };
      var $acesso = $("#selHipoteseLegal option[selected]", $html);
      Acesso.nome = $acesso.text();
      Acesso.valor = $acesso.val();
      DadosProcesso.HipoteseLegal = Acesso;
    }
    resolve(DadosProcesso);
  });
}


