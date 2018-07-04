function ControleGerencial() {
  var data = {
    MenuId: "menu-gerencial",
    MenuTexto: "Controle Gerencial",
    MenuAcao: null
  };

  data.MenuAcao = function (mconsole) {
    mconsole.log("Criando nova tela de controle gerencial...");
    var IdTabela = "TabelaGR";

    /** Título da nova tela */
    $("#divInfraBarraLocalizacao").text("Controle Gerencial de processos");
    $("#divInfraAreaDados").removeAttr("style").append('<img id="imgAguarde" src="/infra_css/imagens/aguarde.gif" />');

    /** Criar o html da tabela de processos */
    var $tabela = $("<table/>").attr("id", IdTabela).addClass("tablesorter").append("<thead/>").append("<tbody/>");
    var $tbody = $("tbody", $tabela);
    var $thead = $("thead", $tabela);
    /** Cabeçalho da tabela */
    var $throw = $("<tr/>");
    $throw.append($("<th/>").text("Processo"));
    $throw.append($("<th/>").text("Sugestão de encaminhamento").attr("style", "width: 10px; white-space: nowrap;"));
    $throw.append($("<th/>").text("Despacho da autoridade").attr("style", "width: 10px; white-space: nowrap;"));
    $throw.append($("<th/>").text("Acompanhamento").attr("style", "width: 10px; white-space: nowrap;"));
    $throw.append($("<th/>").text("Ações").attr("style", "width: 10px;"));
    $thead.append($throw);

    /** Teste de dados */
    // for (let index = 0; index < 10; index++) {
    //   $throw = $("<tr/>");
    //   $throw.append($("<td/>").text("53500.000012/2018-35"));
    //   $throw.append($("<td/>").text("Encaminha processo dxfskdlf sadlf jsldkfj saldkfj sadlfj sdalkfj sdlkf jasdlkf"));
    //   $throw.append($("<td/>").text("sdafksdlf lsadfkj lsadfkj lksad fjlksdf jslakdf jsdaklf jsdal"));
    //   $throw.append($("<td/>").text(" asdkfjsd lf sflsdf ls"));
    //   $throw.append($("<td/>").text("X"));
    //   $tbody.append($throw);
    // }

    /** Recuperar os dados dos processos pelo wssei */
    var dataprocessos = [];
    Promise.all([ws_get(wsapi.processo.listar, "tipo=R"), ws_get(wsapi.processo.listar, "tipo=G")]).then(jsons => {
      jsons.forEach((json) => dataprocessos = dataprocessos.concat(json));
      console.log(dataprocessos);
      return dataprocessos.reduce(function (sequence, processo) {
        return sequence.then(function () {
          /** Pega informações extras */
          return ext_ws_get(ext_wsapi.processo.consultar, null, processo.atributos.idProcedimento);
        }).then(function (processo2) {
          /** Inclui os dados na tabela */
          $throw = $("<tr/>");
          /** Processo / ??? Observação da unidade não está implementado no wssei */
          $throw.append(
            $("<td/>")
              .append($("<a/>")
                .attr("href", "controlador.php?acao=procedimento_trabalhar&id_procedimento=" + processo.id)
                .attr("target", "_blank")
                .text(processo.atributos.numero))
              .append($("<div/>").text(processo2.Observacao))
          );

          /** (Anotação) Sugestão de encaminhamento */
          if (processo.atributos.anotacoes.length > 0) {
            $throw.append($("<td/>").text(processo.atributos.anotacoes[0].descricao).css(processo.atributos.anotacoes[0].sinPrioridade == "S" ? { backgroundColor: "red" } : { backgroundColor: "yellow" }));
          } else {
            $throw.append($("<td/>"));
          }

          /** (Marcador) Despacho da autoridade */
          $throw.append($("<td/>").text("sdafksdlf lsadfkj lsadfkj lksad fjlksdf jslakdf jsdaklf jsdal"));

          /** Acompanhamento Especial */
          $throw.append($("<td/>").text(" asdkfjsd lf sflsdf ls"));

          /** Açoes */
          $throw.append($("<td/>").text("X"));
          $tbody.append($throw);
        });
      }, Promise.resolve());
      // dataprocessos.forEach(function (processo) {
      //   $throw = $("<tr/>");
      //   /** Processo / ??? Observação da unidade não está implementado no wssei */
      //   $throw.append(
      //     $("<td/>")
      //       .append($("<a/>")
      //       .attr("href", "controlador.php?acao=procedimento_trabalhar&id_procedimento=" + processo.id)
      //       .attr("target", "_blank")
      //       .text(processo.atributos.numero))
      //       .append($("<div/>").text(processo.atributos.descricao))
      //   );

      //   /** (Anotação) Sugestão de encaminhamento */
      //   if (processo.atributos.anotacoes.length > 0) {
      //     $throw.append($("<td/>").text(processo.atributos.anotacoes[0].descricao).css(processo.atributos.anotacoes[0].sinPrioridade == "S" ? {backgroundColor: "red"} : {backgroundColor: "yellow"} ));
      //   } else {
      //     $throw.append($("<td/>"));
      //   }

      //   /** (Marcador) Despacho da autoridade */
      //   $throw.append($("<td/>").text("sdafksdlf lsadfkj lsadfkj lksad fjlksdf jslakdf jsdaklf jsdal"));

      //   /** Acompanhamento Especial */
      //   $throw.append($("<td/>").text(" asdkfjsd lf sflsdf ls"));

      //   /** Açoes */
      //   $throw.append($("<td/>").text("X"));
      //   $tbody.append($throw);
      // })
    }).catch(console.error).then(function () {
      /** Adicioan a tabela na tela do sei */
      $tabela.appendTo("#divInfraAreaDados");
      $("#imgAguarde").remove();

      /** Aplica o tablesorter */
      $("#" + IdTabela).tablesorter({
        theme: 'blue',
        headers: {
          4: { sorter: false, filter: false }
        },
        widgets: ["zebra"]
      });

      /** Atualiza a tabela */
      //https://mottie.github.io/tablesorter/docs/example-empty-table.html
      $("#" + IdTabela).trigger("update");

      ws_get(wsapi.documento.listar, "", 3).then(function (json) {
        console.log(json)
      }).catch(console.error);
    });

    /** FIM */
  };

  return data;
}