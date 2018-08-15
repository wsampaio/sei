/**
 * Usando o múdulo de webservice do sei:
 * https://softwarepublico.gov.br/gitlab/sei/mod-wssei
 */
const wsapiname = "WebService_App: ";
const modwsapi = "modulos/wssei/controlador_ws.php/api/v1";
const __storageName = 'wssei_' + window.location.hostname;
const wsapi = {
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
    listar_acompanhamentos: "/processo/listar/acompanhamentos",
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
    listar: "/grupoacompanhamento/listar/{unidade}"
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
function ws_loginGui() {
  return new Promise(function (resolve, reject) {
    var id_dialog = "#dialog-form";
    var cancelado = true;
    var usuario = $("#lnkUsuarioSistema").attr("title").match(/[\-\s](\w+)[?!/]/g)[0].replace("/", "").trim();
    var siglaorgao = $("#lnkUsuarioSistema").attr("title").match(/\w+$/g)[0];

    $(id_dialog).remove();
    $('body').append('<div id="dialog-form" title="SEI++ - Autenticação WsSei"/>');
    $(id_dialog).append("<form/>");
    var $dialog_form = $(id_dialog + " form");

    $dialog_form.append('<label for="txtUsuario"">Usuário: </label>');
    $dialog_form.append('<input type="text" id="txtUsuario" name="txtUsuario" class="infraText" value="' + usuario + '" style="border: none;" disabled>');
    $dialog_form.append('<label for="pwdSenha">Senha: </label>');
    $dialog_form.append('<input type="password" name="pwdSenha" id="pwdSenha" value="" class="text ui-widget-content ui-corner-all">');
    $dialog_form.append('<input type="submit" tabindex="-1" style="display: none;">')

    $(id_dialog).dialog({
      autoOpen: false, height: 200, width: 200, modal: true, resizable: false, draggable: false,
      buttons: {
        Acessar: Acessar,
        Cancelar: function () {
          $(this).dialog("close");
        }
      },
      close: function () {
        console.log("wsapi: Close");
        if (cancelado) reject(Error("Não autenticado"));
        $(id_dialog).remove();
      }
    });
    $(id_dialog).find('form').on("submit", function (event) {
      event.preventDefault();
      Acessar();
    });

    $(id_dialog).dialog("open");

    function Acessar() {
      console.log("wsapi: login");
      cancelado = false;
      resolve({
        usuario: usuario,
        senha: $("#dialog-form #pwdSenha").val(),
        contexto: "",
        orgao: 0,
        siglaorgao: siglaorgao,
      });
      $(id_dialog).dialog("close");
    }
  });
}

function ws_autenticar() {
  return Promise.resolve().then(function () {
    if (window.location.pathname == "/sip/login.php") {
      return Promise.resolve({
        usuario: $("#txtUsuario").val(),
        senha: $("#pwdSenha").val(),
        contexto: "",
        orgao: $("#selOrgao").val(),
        siglaorgao: $("#selOrgao > option[selected]").text(),
      });
    } else {
      return ws_loginGui();
    }
  }).then(data => {
    console.log(wsapiname + "POST " + GetBaseUrl() + modwsapi + wsapi.autenticar);
    return fetch(GetBaseUrl() + modwsapi + wsapi.autenticar, { body: JSON.stringify(data), headers: { 'content-type': 'application/json' }, method: 'POST' });
  }).then(response => response.json()).then(json => {
    if (!json.sucesso) {
      throw new Error("wssei: " + json.mensagem);
    } else {
      return browser.storage.local.set(JSON.parse('{"' + __storageName + '": ' + JSON.stringify(json.data) + "}")).then(() => json.data);
    }
  });
}

function ws_token(Validar = false) {
  return browser.storage.local.get(JSON.parse('{"' + __storageName + '": null }')).then(storageLogin => {
    var Login = Object.getOwnPropertyDescriptor(storageLogin, __storageName).value;
    if (Login == null) {
      throw new Error("Sessao não salva: Token nulo.");
    } else if (Login.loginData.sigla != $("#lnkUsuarioSistema").attr("title").match(/[\-\s](\w+)[?!/]/g)[0].replace("/", "").trim()) {
      throw new Error("Sessao não salva: Token inválido.");
    } else {
      if (Validar) {
        return ws_get(wsapi.usuario.unidades, "usuario=" + Login.loginData.IdUsuario).then(() => Login);
      }
      return Login;
    }
  });
}

function ws_post(apirest, json_data, id_url = null) {
  return ws_token().then(function (Login) {
    if (apirest.indexOf("{") != -1) {
      if (id_url != null) {
        apirest = apirest.replace(/\{\w+\}/g, id_url);
      } else {
        return Promise.reject("Necessário informar o id: " + apirest.match(/\{\w+\}/g));
      }
    }
    console.log(wsapiname + "POST " + GetBaseUrl() + modwsapi + apirest, json_data);
    return fetch(GetBaseUrl() + modwsapi + apirest, {
      body: JSON.stringify(json_data),
      headers: { 'content-type': 'application/json', 'token': Login.token, 'unidade': Login.loginData.IdUnidadeAtual },
      method: 'POST'
    });
  }).then(response => response.json()).then(function (json) {
    console.log(json);
    if (json.sucesso) {
      if (apirest == wsapi.usuario.alterar_unidade) {
        /** Atualiza storage de informações da unidade */
        return ws_token().then(Login => {
          Login.loginData.IdUnidadeAtual = json_data.unidade;
          return browser.storage.local.set(JSON.parse('{"' + __storageName + '": ' + JSON.stringify(Login) + "}")).then(() => Login);
        });
      } else if (json.data == undefined) {
        return [];
      } else {
        return json.data;
      }
    } else {
      console.log(json);
      return Promise.reject(Error(json.mensagem));
    }
  }).catch(function (err) {
    return Promise.reject(err);
  });
}

function ws_get(apirest, params = null, id_url = null) {
  var urlapi = GetBaseUrl() + modwsapi + apirest + (params != null && params != "" ? "?" + params : "");
  if (urlapi.indexOf("{") != -1) {
    if (id_url != null) {
      urlapi = urlapi.replace(/\{\w+\}/g, id_url);
    } else {
      return Promise.reject(wsapiname + "Necessário informar o id: " + urlapi.match(/\{\w+\}/g) + " > apirest");
    }
  }
  return Promise.resolve().then(function () {
    if (apirest == wsapi.orgao.listar) {
      return Promise.resolve({ token: "", loginData: { IdUnidadeAtual: "" }  });
    } else {
      return ws_token();
    }
  }).then(function (Login) {
    console.log(wsapiname + "GET " + urlapi);
    return fetch(urlapi, {
      headers: { 'content-type': 'application/json', 'token': Login.token, 'unidade': Login.loginData.IdUnidadeAtual },
      method: 'GET'
    });
  }).then(response => response.json()).then(function (json) {
    if (json.sucesso) {
      if (json.data == undefined) { return []; } else { return json.data; }
    } else {
      return Promise.reject(Error(json.mensagem));
    }
  });
}
