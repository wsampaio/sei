function NovaTela(BaseName) {
  var ModName = BaseName + ".NovaTela";
  var mconsole = new __mconsole(ModName);
  var Acoes = [];

  function AdicionarNovaTela(func) {
    var Acao = func();
    Acoes.push(Acao);

    $("<li>").append($("<a/>").attr("id", Acao.MenuId).attr("href", ".").text(Acao.MenuTexto)).prependTo("#main-menu");
    $("#" + Acao.MenuId).on("click", function () { SalvarAcao(Acao.MenuId); });
  }

  function SalvarAcao(Acao) {
    browser.storage.local.set({ NovaTela: Acao }).then(function (params) {
      mconsole.log("AdicionarNovaTela > Ação acionada no menu: " + params);
    }, function (err) {
      mconsole.log("AdicionarNovaTela > Ação acionada ERRO: " + err);
    });
  }

  /** Se existir o menu execulta */
  if ($("#main-menu").length) {
    var $MenuProcControlar = $("#main-menu > li > a[href^='controlador.php?acao=procedimento_controlar'");
    $MenuProcControlar.on("click", function () { SalvarAcao(null); });
    AdicionarNovaTela(ControleGerencial);
  }

  /** Processa a nova tela */
  if (window.location.href == GetBaseUrl()) {
    browser.storage.local.get({ NovaTela: null }).then(function (IdTela) {
      mconsole.log(IdTela.NovaTela);

      if (IdTela.NovaTela != null) {
        for (const Acao of Acoes) {
          mconsole.log("Acao > " + Acao);
          if (Acao.MenuId == IdTela.NovaTela) { Acao.MenuAcao(ModName); }
        }
      } else {
        var href = $MenuProcControlar.attr("href");
        if (href != "") { window.location.assign(href); }
      }
    });
  }
}