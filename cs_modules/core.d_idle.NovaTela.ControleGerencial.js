function ControleGerencial() {
  var data = {
    MenuId: "menu-gerencial",
    MenuTexto: "Controle Gerencial",
    MenuAcao: null
  };

  data.MenuAcao = function (mconsole) {
    mconsole.log("Criando nova tela de controle gerencial...");
    var IdTabela = "TabelaGR";
    var $tabela = null;

    /** Título da nova tela */
    $("#divInfraBarraLocalizacao").text("Controle Gerencial de processos");
    $("#divInfraAreaDados").removeAttr("style").append('<img id="imgAguarde" src="/infra_css/imagens/aguarde.gif" />');

    TabelaCriar();

    /** Recuperar os dados dos processos pelo wssei */
    var dataprocessos = [];
    Promise.all([ws_get(wsapi.processo.listar, "tipo=R"), ws_get(wsapi.processo.listar, "tipo=G")]).then(jsons => {
      jsons.forEach((json) => dataprocessos = dataprocessos.concat(json));
      console.log(dataprocessos);
      return dataprocessos.reduce(function (sequence, processo) {
        return sequence.then(function () {
          /** Pega informações extras */
          return ext_ws_get(ext_wsapi.processo.consultar, null, processo.atributos.idProcedimento).then(function (proc) {
            return ext_ws_get(ext_wsapi.processo.consultar_dados, proc).then(function (dados) {
              return ext_ws_get(ext_wsapi.processo.marcador, proc).then(function (mardador) {
                return Promise.resolve({ processo: proc, dados: dados, marcador: mardador });
              });
            });
          });
        }).then(function (DadosExtras) {
          TabelaAdicinarProcesso(processo, DadosExtras);
        });
      }, Promise.resolve());
    }).catch(console.error).then(function () {
      /** Adicioan a tabela na tela do sei */
      $tabela.appendTo("#divInfraAreaDados");
      $("#imgAguarde").remove();

      /** Aplica o tablesorter */
      $tabela.tablesorter({
        theme: 'blue',
        headers: {
          5: { sorter: false, filter: false }
        },
        widgets: ["zebra"],
        textExtraction: {
          0: function (node, table, cellIndex) {
            return $("div[title]:first", node).text();
          },
          3: function (node, table, cellIndex) {
            var texto = $(node).text();
            return texto.indexOf("vermelho") != -1 ? 0 : texto.indexOf("amarelo") != -1 ? 2 : texto.indexOf("verde") != -1 ? 3 : texto.indexOf("roxo") != -1 ? 4 : 99;
          }
        }
      });

      /** Atualiza a tabela */
      //https://mottie.github.io/tablesorter/docs/example-empty-table.html
      $tabela.trigger("update");

      ws_get(wsapi.documento.listar, "", 3).then(function (json) {
        console.log(json)
      }).catch(console.error);
    });

    /**  */
    function TabelaCriar() {
      /** Criar o html da tabela de processos */
      $tabela = $("<table/>").attr("id", IdTabela).addClass("tablesorter").append("<thead/>").append("<tbody/>");
      var $thead = $("thead", $tabela);
      /** Cabeçalho da tabela */
      var $throw = $("<tr/>");
      $throw.append($("<th/>").text("Processo"));
      $throw.append($("<th/>").text("tipo").addClass("columnHide"));
      $throw.append($("<th/>").text("Sugestão de encaminhamento").attr("style", "width: 10px; white-space: nowrap;"));
      $throw.append($("<th/>").text("Despacho da autoridade").attr("style", "width: 10px; white-space: nowrap;"));
      $throw.append($("<th/>").text("Acompanhamento").attr("style", "width: 10px; white-space: nowrap;"));
      $throw.append($("<th/>").text("Ações").attr("style", "width: 10px;"));
      $thead.append($throw);
    }

    /**
     *
     * @param {ws_ProcessoListar} processo
     * @param {*} DadosExtras
     */
    function TabelaAdicinarProcesso(processo, DadosExtras) {
      var $tbody = $("tbody", $tabela);
      /** Inclui os dados na tabela */
      var $trrow = $("<tr/>");
      /** Processo / Observação da unidade */
      $trrow.append(
        $("<td/>")
          .append($("<div/>")
            .attr("id", "proc" + processo.atributos.idProcedimento)
            .attr("title", processo.atributos.tipoProcesso)
            .append($("<a/>")
              .attr("href", "controlador.php?acao=procedimento_trabalhar&id_procedimento=" + processo.id)
              .attr("target", "_blank")
              .text(processo.atributos.numero)))
          .append($("<div/>").text(DadosExtras.dados.Observacao))
      );
      if (DadosExtras.processo.Flags.Restrito != null) {
        $("div[id^='proc']", $trrow).append($("<img/>")
          .attr("src", "imagens/sei_chave_restrito.gif")
          .attr("title", DadosExtras.processo.Flags.Restrito)
        );
      }
      if (DadosExtras.processo.Flags.PontoControle != null) {
        $("div[id^='proc']", $trrow).append($("<img/>")
          .attr("src", "imagens/sei_situacao_pequeno.png")
          .attr("title", DadosExtras.processo.Flags.PontoControle)
        );
      }
      if (DadosExtras.processo.Flags.Marcador.Nome != null) {
        $("div[id^='proc']", $trrow).append($("<img/>")
          .attr("src", "imagens/marcador_" + DadosExtras.processo.Flags.Marcador.Cor + ".png")
          .attr("title", DadosExtras.processo.Flags.Marcador.Nome)
        );
      }
      /** (HIDE)Tipo de processo */
      $trrow.append($("<td/>").text(processo.atributos.tipoProcesso).addClass("columnHide"));

      /** (Anotação) Sugestão de encaminhamento */
      if (processo.atributos.anotacoes.length > 0) {
        $trrow.append($("<td/>").text(processo.atributos.anotacoes[0].descricao).css(processo.atributos.anotacoes[0].sinPrioridade == "S" ? { backgroundColor: "red" } : { backgroundColor: "yellow" }));
      } else {
        $trrow.append($("<td/>"));
      }

      /** (Marcador) Despacho da autoridade / ???? não está implementado no wssei */
      $trrow.append($("<td/>")
        .append($("<div/>").text(DadosExtras.marcador.marcador))
        .append($("<div/>").text(DadosExtras.marcador.texto))
      );
      /** Acompanhamento Especial */
      $trrow.append($("<td/>").text("asdkfjsd lf sflsdf ls"));

      /** Açoes */
      $trrow.append($("<td/>").text("X"));
      $tbody.append($trrow);
    }
  };

  return data;
}