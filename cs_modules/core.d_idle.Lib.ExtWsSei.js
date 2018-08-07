/**
 * Métodos não suportados no múdulo de webservice do sei:
 * core.d_idle.Lib.WsSei.js
 */
const seipp_api_name = "Sei++_API: ";
var seipp_api = {
  processo: {
    consultar: "__ProcessoConsultar",
    consultar_dados: "procedimento_alterar",
    marcador: "andamento_marcador_gerenciar",
    acompanhamento: "acompanhamento_cadastrar"
  },
  marcador: {
    listar: "marcador_listar"
  }
}

/**
 * Api POST (Criar/Alterar/Excluir)
 * @param {*} apirest
 * @param {*} json_data
 */
function ext_ws_post(apirest, json_data) {
  if (__isInGroup(seipp_api, apirest)) {
    if (__isInGroup(seipp_api.processo, apirest)) {
      return ext_ws_get(seipp_api.processo.consultar, null, json_data.idProcesso).then(proc => {
        /** Pega o link para buscar os dados */
        var link = proc.LinkComandos.reduce((acc, cur, i) => {
          if (cur.indexOf(apirest) != -1) acc = cur;
          return acc;
        });
        console.log(apirest + "GET " + apirest + " > " + link);
        return fetch(link, { method: 'GET' });
      }).then(response => {
        /** Converte a resposta para ISO-8859-1 */
        var contentType = response.headers.get("content-type");
        if (response.ok) {
          if (contentType && contentType.includes("text/html")) {
            return response.arrayBuffer().then(buf => new TextDecoder('ISO-8859-1').decode(buf));
          } else { console.log(contentType); throw new Error("Erro no Content Type esperado!"); }
        } else {
          throw new Error(response.statusText + ": " + response.status);
        }
      }).then(resp => {
        /** Trata a resposta de acordo com a api */
        switch (apirest) {
          case seipp_api.processo.marcador:
            return __ProcessoCadastrarMarcador_Post(resp, json_data);
          case seipp_api.processo.acompanhamento:
            return __ProcessoAcompanhamentoCadastrarAlterar_Post(resp, json_data);
          default:
            return Promise.reject(seipp_api_name + ": Api não implementada");
        }
      }).then(post => {
        /** Envia o post da requisição */
        console.log(seipp_api_name + "POST " + apirest + " > " + post.url, post.data);
        post.data = postEncodeURI(post.data);
        return fetch(post.url, {
          body: JSON.stringify(post.data),
          headers: { 'content-type': 'application/x-www-form-urlencoded' },
          method: 'POST'
        });
      }).then(resp => {
        if (resp.redirected && resp.ok) {
          return json_data;
        } else {
          return Promise.reject(resp);
        }
      });
    }
  } else {
    reject(Error("Api não implementada: " + apirest));
  }
}

/**
 * Encore raw data post.
 * @param {object} data Objeto com os dados post.
 */
function postEncodeURI(data) {
  var postdata = "";

  for (const name in data) {
    const value = data[name];
    if (postdata != "") { postdata = postdata + "&" }
    postdata = postdata + name + "=" + escape(value.replace(/\s/g, "+"))
  }
  return postdata
}

function ext_ws_get(apirest, params = null, id_url = null) {
  return Promise.resolve().then(() => {
    var link = "";
    if (__isInGroup(seipp_api, apirest)) {
      if (__isInGroup(seipp_api.processo, apirest)) {
        if (apirest == seipp_api.processo.consultar) {
          if (params != null && params != "") {
            link = params;
          } else if (id_url != null) {
            link = GetBaseUrl() + "controlador.php?acao=procedimento_trabalhar&id_procedimento=" + id_url;
          } else {
            throw new Error("IdProcesso não informado");
          }
        } else {/** Pega o link do comando */
          link = params.LinkComandos.find(function (cmd) {
            if (cmd.indexOf(apirest) != -1) return cmd;
          });
        }
        if (link == undefined) {
          switch (apirest) {
            // case ext_wsapi.processo.acompanhamento:
            //   var resp = {msg: null, ok: true, headers: new Headers({ "content-type": "wsapi" }) };
            //   return resp;
            default:
              throw new Error(seipp_api_name + ": Link de comando do processo não encontrado: " + apirest);
          }
        }
      } else { /** comandos do menu */
        link = GetBaseUrl() + $("#main-menu li a[href^='controlador.php?acao=" + apirest + "']").attr("href");
      }
    } else {
      throw new Error("Api não implementada: " + apirest);
    }
    /** Execulta a consulta */
    console.log(seipp_api_name + "GET " + apirest + " > " + link);
    return fetch(link, { method: 'GET' });
  }).then(function (response) {
    var contentType = response.headers.get("content-type");
    if (response.ok) {
      if (contentType && contentType.includes("text/html")) {
        return response.arrayBuffer().then(buf => new TextDecoder('ISO-8859-1').decode(buf));
      } else if (contentType && contentType.includes("wsapi")) {
        return response.msg;
      } else { console.log(contentType); throw new Error("Erro no Content Type esperado!"); }
    } else {
      throw new Error(response.statusText + ": " + response.status);
    }
  }).then(function (resp) {
    switch (apirest) {
      case seipp_api.processo.consultar:
        return __ProcessoConsultar(resp);
      case seipp_api.processo.consultar_dados:
        return __ProcessoConsultarDados(resp);
      case seipp_api.processo.marcador:
        return __ProcessoConsultarMarcador(resp);
      case seipp_api.processo.acompanhamento:
        return __ProcessoAcompanhamentoConsultar(resp);
      case seipp_api.marcador.listar:
        return __MarcadorListar(resp);
      default:
        throw new Error("Api não implementada");
    }
  });
}

function __isInGroup(group, value) {
  for (const iterator in group) {
    if (typeof group[iterator] == "object") if (__isInGroup(group[iterator], value)) return true;
    if (group[iterator] == value) return true;
  }
  return false;
}

/**
 * Retorna JSON com os dados e comandos do processo.
 * @param {*} resp
 */
function __ProcessoConsultar(resp) {
  return new Promise((resolve, reject) => {
    var $html = $($.parseHTML(resp));
    var Processo = {
      __tipo: "processo",
      id: -1,
      Numero: -1,
      Flags: {
        Restrito: null,
        PontoControle: null,
        Marcador: {
          Nome: null,
          Cor: null,
        },
      },
      LinkComandos: [],
    };

    var linkArvore = $("#ifrArvore", $html).attr("src");
    if (linkArvore != undefined) {
      linkArvore = GetBaseUrl() + linkArvore;
      resolve(ext_ws_get(seipp_api.processo.consultar, linkArvore));
    } else {
      /** Pega os links dos camandos do processo */
      var x = resp.indexOf("Nos[0].acoes");
      x = resp.indexOf("'", x) + 1;
      var y = resp.indexOf("Nos[0]", x) - 3;
      var $html2 = $($.parseHTML(resp.substring(x, y)));
      $html2.each(function (i, tag) {
        var href = $(tag).attr("href");
        if (href != "#") Processo.LinkComandos.push(GetBaseUrl() + href);
      });
      if (Processo.LinkComandos.length < 1) {
        throw new Error("Link de comandos do processo não encontrado.");
      }
      /** Pega as ações flags do processo */
      x = resp.indexOf('infraArvoreAcao("NIVEL_ACESSO'); /** ACESSO RESTRITO */
      if (x != -1) {
        x = resp.indexOf("Acesso Restrito\\n", x) + 17;
        y = resp.indexOf('"', x);
        Processo.Flags.Restrito = resp.substring(x, y);
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

      /** Pega o id do processo */
      x = resp.indexOf("id_procedimento=");
      x = resp.indexOf('=', x) + 1;
      y = resp.indexOf('&', x);
      Processo.id = resp.substring(x, y);

      resolve(Processo);
    }
  });
}

/**
 * Consulta os dados do processo (Tela alterar processo)
 * @param {*} $html
 */
function __ProcessoConsultarDados(resp) {
  return new Promise((resolve, reject) => {
    var $html = $($.parseHTML(resp));
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
      ObservacaoOutrasUnidades: [],
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
    $("#divObservacoesOutras > table > tbody > tr[class]", $html).each(function (index) {
      var observacao = {
        index: index,
        unidade: $(this).find("td:nth-child(1)").text(),
        observacao: $(this).find("td:nth-child(2)").text()
      }
      DadosProcesso.ObservacaoOutrasUnidades.push(observacao);
    });

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

function __ProcessoConsultarMarcador(resp) {
  return new Promise((resolve, reject) => {
    var $html = $($.parseHTML(resp));
    var marcador = {
      id: -1,
      marcador: "",
      data: null,
      usuario: "",
      texto: "",
      cor: "",
      historico: []
    };
    var $tabela = $("#tblHistorico tr[class='infraTrClara']", $html);
    if ($tabela.length) {
      $tabela.each(function () {
        var historico = {
          data: $("td:eq(0)", $(this)).text(),
          usuario: $("td:eq(1)", $(this)).text(),
          marcador: $("td:eq(2)", $(this)).text(),
          texto: $("td:eq(3)", $(this)).text()
        };
        marcador.historico.push(historico);
      });
      var $optsel = $("#selMarcador option[selected]", $html);
      if ($optsel.val() != "null") {
        console.log($optsel);
        marcador.id = $optsel.val();
        marcador.marcador = $optsel.text();
        marcador.data = marcador.historico[0].data;
        marcador.usuario = marcador.historico[0].usuario;
        marcador.texto = marcador.historico[0].texto;
        marcador.cor = $optsel.attr("data-imagesrc");
        marcador.cor = marcador.cor.substring(
          marcador.cor.indexOf("_") + 1,
          marcador.cor.indexOf(".png")
        );
      }
    }
    resolve(marcador);
  });
}
/*var Marcador = {
  id: -1,
  idProcesso: -1,
  texto: ""
}
var post = {
  url: "",
  data: ""
}*/
function __ProcessoCadastrarMarcador_Post(resp, json_data) {
  return new Promise((resolve, reject) => {
    var excludes = ["selMarcador"];
    var $html = $($.parseHTML(resp));
    var post = { url: "", data: {} };
    post.url = GetBaseUrl() + $("#frmGerenciarMarcador", $html).attr("action");

    $("#frmGerenciarMarcador [name]", $html).each(function () {
      var name = $(this).attr("name");
      var val = $(this).val();
      if (excludes.find(n => n == name) == undefined && val != undefined) {
        switch (name) {
          case "hdnIdMarcador":
            post.data[name] = json_data.id;
            break;
          case "txaTexto":
            post.data[name] = json_data.texto;
            break;
          default:
            post.data[name] = val;
            break;
        }
      }
    });
    resolve(post);
  });
}

function __ProcessoAcompanhamentoConsultar(resp) {
  return new Promise((resolve, reject) => {
    var acompanhamento = {
      id: -1,
      grupo: null,
      observacao: ""
    }
    //console.log(resp);
    if (true/* resp != null */) {
      /** Se tiver acomapnhamento */
      var $html = $($.parseHTML(resp));
      acompanhamento.id = $("#hdnIdAcompanhamento", $html).val();
      acompanhamento.id = acompanhamento.id == "" ? -1 : acompanhamento.id;
      acompanhamento.observacao = $("#txaObservacao", $html).val();
      var $sel = $("#selGrupoAcompanhamento > option[selected]");
      if ($sel.val() != undefined) {
        var grupo = {
          id: $sel.val(),
          nome: $sel.text()
        }
        acompanhamento.grupo = grupo;
      }
    }
    resolve(acompanhamento);
  });
}
var acompanhamento = {
  id: -1,
  idProcesso: -1,
  grupo: null,
  observacao: ""
}
function __ProcessoAcompanhamentoCadastrarAlterar_Post(resp, json_data) {
  return new Promise((resolve, reject) => {
    var excludes = ["btnExcluir"];
    var $html = $($.parseHTML(resp));
    var post = { url: "", data: {} };
    if (isUndefined(json_data.excluir, false)) {
      var x, y;
      x = resp.indexOf("controlador.php?acao=acompanhamento_excluir");
      y = resp.indexOf("'",x);
      post.url = GetBaseUrl() + resp.substring(x, y);
      excludes.push("sbmAlterarAcompanhamento");
    } else {
      post.url = GetBaseUrl() + $("#frmAcompanhamentoCadastro", $html).attr("action");
    }

    $("#frmAcompanhamentoCadastro [name]", $html).each(function () {
      var name = $(this).attr("name");
      var val = $(this).val();

      if (excludes.find(n => n == name) == undefined && val != undefined) {
        switch (name) {
          case "txaObservacao":
            post.data[name] = isUndefined(json_data.observacao, val);
            break;
          case "selGrupoAcompanhamento":
            post.data[name] = isUndefined(json_data.grupo, val);
            break;
          case "hdnIdAcompanhamento":
            post.data[name] = isUndefined(json_data.id, val);
            break;
          case "hdnIdProcedimento":
            post.data[name] = isUndefined(json_data.idProcesso, val);
            break;
          default:
            post.data[name] = val;
            break;
        }
      }
    });
    resolve(post);
  });
}
function __MarcadorListar(resp) {
  return new Promise((resolve, reject) => {
    var $html = $($.parseHTML(resp));
    var marcadores = [];
    var $tabela = $("#divInfraAreaTabela > table > tbody > tr[class]", $html);
    if ($tabela.length) {
      console.log($tabela.html());
      $tabela.each(function () {
        var marcador = {
          id: $("td:eq(3)", $(this)).text(),
          nome: $("td:eq(2)", $(this)).text(),
          cor: $("td:eq(1) > a > img", $(this)).attr("src")
        };
        marcador.cor = marcador.cor.substring(
          marcador.cor.indexOf("_") + 1,
          marcador.cor.indexOf(".png")
        );
        marcadores.push(marcador);
      });
      resolve(marcadores);
    } else {
      if ($("#divInfraAreaTabela", $html).length == 1) {
        resolve(marcadores);
      } else {
        reject(seipp_api_name + "Erro ao listar marcadores");
      }
    }
  });
}