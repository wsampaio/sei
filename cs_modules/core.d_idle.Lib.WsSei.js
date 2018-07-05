/**
 * Usando o múdulo de webservice do sei:
 * https://softwarepublico.gov.br/gitlab/sei/mod-wssei
 */

var modwsapi = "modulos/wssei/controlador_ws.php/api/v1";
var wsapi = {
  autenticar: "/autenticar",
  orgao: {
    listar: "/orgao/listar"
  },
  contexto: {
    listar: "/contexto/listar/{orgao}"
  },
  usuario: {
    alterar_unidade: "/usuario/alterar/unidade",
    listar: "/usuario/listar",
    pesquisar: "/usuario/pesquisar",
    unidades: "/usuario/unidades"
  },
  unidade: {
    pesquisar: "/unidade/pesquisar"
  },
  anotacao: "/anotacao/",
  bloco: {
    listar: "/bloco/listar",
    retornar: "/bloco/{bloco}/retornar",
    listar_documentos: "/bloco/listar/{bloco}/documentos",
    anotacao: "/bloco/{bloco}/anotacao",
    assinar: "/bloco/assinar/{bloco}"
  },
  documento: {
    listar_ciencia: "/documento/listar/ciencia/{protocolo}",
    listar_assinaturas: "/documento/listar/assinaturas/{documento}",
    assinar_bloco: "/documento/assinar/bloco",
    ciencia: "/documento/ciencia",
    assinar: "/documento/assinar",
    listar: "/documento/listar/{procedimento}",
    baixar_anexo: "/documento/baixar/anexo/{protocolo}"
  },
  processo: {
    cancelar_sobrestar: "/processo/cancelar/sobrestar",
    listar_ciencia: "/processo/listar/ciencia/{protocolo}",
    consultar: "/processo/consultar",
    sobrestar_processo: "/processo/{protocolo}/sobrestar/processo",
    ciencia: "/processo/{procedimento}/ciencia",
    listar_sobrestamento: "/processo/listar/sobrestamento/{protocolo}",
    listar_unidades: "/processo/listar/unidades/{protocolo}",
    listar: "/processo/listar",
    pesquisar: "/processo/pesquisar",
    listar_meus_acompanhamentos: "/processo/listar/meus/acompanhamentos",
    acompanhamentos: "/processo/listar/acompanhamentos",
    enviar: "/processo/enviar",
    concluir: "/processo/concluir",
    reabrir: "/processo/reabrir/{procedimento}",
    acompanhar: "/processo/acompanhar",
    retorno_programado: "/processo/agendar/retorno/programado",
    atribuir: "/processo/atribuir",
    verifica_acesso: "/processo/verifica/acesso/{protocolo}",
    identificacao_acesso: "/processo/identificacao/acesso",
    credenciamento_conceder: "/processo/{procedimento}/credenciamento/conceder",
    credenciamento_renunciar: "/processo/{procedimento}/credenciamento/renunciar",
    credenciamento_cassar: "/processo/{procedimento}/credenciamento/cassar",
    credenciamento_listar: "/processo/{procedimento}/credenciamento/listar"
  },
  atividade: {
    listar: "/atividade/listar",
    andamento_processo: "/atividade/lancar/andamento/processo"
  },
  assinante: {
    listar: "/assinante/listar/{unidade}",
    orgao: "/assinante/orgao"
  },
  grupoacompanhamento: {
    listar: "/grupoacompanhamento/listar/{unidade}:"
  },
  observacao: "/observacao/"
};

var ws_ProcessoListar = {
  id: 0,
  status: "string",
  seiNumMaxDocsPasta: 0,
  atributos: {
    idProcedimento: 0,
    idProtocolo: 0,
    numero: "string",
    tipoProcesso: "string",
    descricao: "string",
    usuarioAtribuido: "string",
    unidade: {
      idUnidade: 0,
      sigla: "string"
    },
    dadosAbertura: [
      {
        info: "string",
        lista: [
          {
            id: 0,
            nome: "string"
          }
        ],
        unidades: [
          {
            id: 0,
            nome: "string"
          }
        ]
      }
    ],
    anotacoes: [
      {
        idAnotacao: 0,
        idProtocolo: 0,
        descricao: "string",
        idUnidade: 0,
        idUsuario: 0,
        dthAnotacao: "string",
        sinPrioridade: "string",
        staAnotacao: "string"
      }
    ],
    status: {
      documentoSigiloso: "string",
      documentoRestrito: "string",
      documentoNovo: "string",
      documentoPublicado: "string",
      anotacao: "string",
      anotacaoPrioridade: "string",
      ciencia: "string",
      retornoProgramado: "string",
      retornoData: {
        dataProgramada: "string",
        unidade: "string"
      },
      retornoAtrasado: "string",
      processoAcessadoUsuario: "string",
      processoAcessadoUnidade: "string",
      processoRemocaoSobrestamento: "string",
      processoBloqueado: "string",
      processoDocumentoIncluidoAssinado: "string",
      processoPublicado: "string",
      nivelAcessoGlobal: "string",
      podeGerenciarCredenciais: "string",
      processoAberto: "string",
      processoEmTramitacao: "string",
      processoSobrestado: "string",
      processoAnexado: "string",
      podeReabrirProcesso: "string",
      podeRegistrarAnotacao: "string"
    }
  }
}

/**
 * Exibe a janela de login, retorna json.
 */
function ws_login() {
  return new Promise(function (resolve, reject) {
    var id_dialog = "#dialog-form";
    var cancelado = true;
    var usuario = $("#lnkUsuarioSistema").attr("title").match(/[\-\s](\w+)[?!/]/g)[0].replace("/", "").trim();
    var siglaorgao = $("#lnkUsuarioSistema").attr("title").match(/\w+$/g)[0];

    $(id_dialog).remove();
    $('body').append('<div id="dialog-form" title="SEI++ - Autenticação WsSei"/>');
    $('#dialog-form').append('<label">Usuário: </label>');
    $('#dialog-form').append('<input type="text" id="txtUsuario" name="txtUsuario" class="infraText" value="' + usuario + '" style="border: none;" disabled>');
    $('#dialog-form').append('<label">Senha: </label>');
    $('#dialog-form').append('<input type="password" name="pwdSenha" id="pwdSenha" value="" class="text ui-widget-content ui-corner-all">');

    $(id_dialog).dialog({
      autoOpen: false, height: 200, width: 200, modal: true, resizable: false, draggable: false,
      buttons: {
        Acessar: function () {
          console.log("wsapi: login");
          cancelado = false;
          resolve({
            usuario: usuario,
            senha: $("#dialog-form #pwdSenha").val(),
            contexto: "",
            orgao: 0,
            siglaorgao: siglaorgao,
          });
          $(this).dialog("close");
        },
        Cancelar: function () {
          $(this).dialog("close");
        }
      },
      close: function () {
        console.log("wsapi: Close");
        $(id_dialog).remove();
        if (cancelado) reject(Error("Não autenticado"));
      }
    });

    $(id_dialog).dialog("open");
  });
}

function ws_autenticar(Atualizar = false) {
  return browser.storage.local.get({ wsseilogin: null }).then(function (Login) {
    //console.log("Token: " + Login.wsseilogin.token);
    if (Login.wsseilogin == null || Atualizar == true) {
      return ws_login().then(function (data) {
        return fetch(GetBaseUrl() + modwsapi + wsapi.autenticar, { body: JSON.stringify(data), headers: { 'content-type': 'application/json' }, method: 'POST' });
      }).then(response => response.json()).then(function (json) {
        console.log(json);
        return browser.storage.local.set({ wsseilogin: json.data }).then(() => json.data);
      }).catch(function (err) {
        console.log(err);
        return Promise.reject(err);
      });
    } else {
      return Promise.resolve(Login.wsseilogin);
    }
  }).catch(function (err) {
    console.log(err);
    return Promise.reject(err);
  });
}

function ws_post(apirest, json_data) {
  return ws_autenticar().then(function (Login) {
    return fetch(GetBaseUrl() + modwsapi + apirest, {
      body: JSON.stringify(json_data),
      headers: { 'content-type': 'application/json', 'token': Login.token },
      method: 'POST'
    });
  }).then(response => response.json()).then(function (json) {
    console.log(json);
    if (json.sucesso) {
      if (json.data == undefined) { return []; } else { return json.data; }
    } else if (json.mensagem == "Token inválido!") {
      /** Atualiza o token e execulta a função novamente */
      console.log("Atualizar o token....");
      return ws_autenticar(true).then(() => ws_get(apirest, json_data));
    } else {
      console.log(json);
      return Promise.reject(Error(json.mensagem));
    }
  }).catch(function (err) {
    return Promise.reject(err);
  });
}

function ws_get(apirest, params, id_url = null) {
  var urlapi = GetBaseUrl() + modwsapi + apirest + (params != null ? "?" + params : "");
  var TemId = urlapi.indexOf("{") != -1
  if (TemId) {
    if (id_url != null) {
      urlapi = urlapi.replace(/\{\w+\}/g, id_url);
    } else {
      return Promise.reject("Necessário informar o id: " + urlapi.match(/\{\w+\}/g));
    }
  }
  return ws_autenticar().then(function (Login) {
    return fetch(urlapi, {
      headers: { 'content-type': 'application/json', 'token': Login.token },
      method: 'GET'
    });
  }).then(response => response.json()).then(function (json) {
    console.log(json);
    if (json.sucesso) {
      if (json.data == undefined) { return []; } else { return json.data; }
    } else if (json.mensagem == "Token inválido!") {
      /** Atualiza o token e execulta a função novamente */
      console.log("Atualizar o token....");
      return ws_autenticar(true).then(() => ws_get(apirest, params, id_url));
    } else {
      console.log(json);
      return Promise.reject(Error(json.mensagem));
    }
  }).catch(function (err) {
    return Promise.reject(err);
  });
}
