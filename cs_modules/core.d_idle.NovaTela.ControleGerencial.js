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
    var Marcadores = [];
    var GrupoAcompanhamentos = [];

    /** Recuperar os dados dos processos pelo wssei */
    var dataprocessos = [];
    var progressbar_val = 0;

    /** Título da nova tela */
    $("#divInfraBarraLocalizacao").text("Controle Gerencial de Processos");
    $("#divInfraAreaDados").removeAttr("style").append('<div id="progressbar"><div class="progress-label">0%</div></div>');
    var $progressbar = $("#progressbar");
    $progressbar.progressbar({
      value: false,
      change: function () {
        console.log("change");
        $("#progressbar div.progress-label").text($progressbar.progressbar("value") + "%");
      },
      complete: function () {
        $("#progressbar div.progress-label").text("");
      },
      create: function () {
        $("#progressbar div.progress-label").text("Aguarde...");
      }
    });

    /** Verifica a versão mínima do navegador */
    if (!isChrome) {
      browser.storage.local.get("version").then(function (params) {
        var version = parseInt(params.version);
        if (version < 60) {
          $("#divInfraAreaDados").append("Firefox versão: " + version + " - é necessário a versão igual ou maior que 60 do navegador.").css({ backgroundColor: "red" });
        }
      }, null);
    }

    /** Verifica se o WebService do SEI está ativo */
    ws_get(wsapi.orgao.listar).then(function () {
      /** Pega a lista de marcadores */
      ext_ws_get(seipp_api.marcador.listar).then(function (marc) {
        Marcadores = marc;
        console.log("marcadores: ", marc);
      }).catch(console.log);

      /** Pega a lista de marcadores */
      ws_get(wsapi.grupoacompanhamento.listar).then(function (grupoacomp) {
        GrupoAcompanhamentos = grupoacomp;
        console.log("marcadores: ", GrupoAcompanhamentos);
      }).catch(console.log);

      TabelaCriar();
      return ws_token(true);
    }).catch(err => {
      console.log(err.message);
      if (err.message.indexOf("Módulo inativo") != -1) {
        return Promise.reject(err);
      } else {
        return ws_autenticar();
      }
    }).then(() => Promise.all([ws_get(wsapi.processo.listar, "tipo=R"), ws_get(wsapi.processo.listar, "tipo=G")])).then(jsons => {
      jsons.forEach((json) => dataprocessos = dataprocessos.concat(json));
      console.log(dataprocessos);
      if (dataprocessos.length == 0) {
        $progressbar.progressbar("value", 100);
      } else {
        progressbar_val = 100.0 / dataprocessos.length;
        console.log(progressbar_val);
      }
      return dataprocessos.reduce(function (sequence, processo) {
        return sequence.then(function () {
          /** Pega informações extras */
          return ext_ws_get(seipp_api.processo.consultar, null, processo.atributos.idProcedimento).then(function (proc) {
            return ext_ws_get(seipp_api.processo.consultar_dados, proc).then(function (dados) {
              return ext_ws_get(seipp_api.processo.marcador, proc).then(function (mardador) {
                return ext_ws_get(seipp_api.processo.acompanhamento, proc).then(function (acompanhamento) {
                  return ws_get(wsapi.processo.listar_ciencia, null, processo.atributos.idProcedimento).then(function (ciencias) {
                    return Promise.resolve({ processo: proc, dados: dados, marcador: mardador, acompanhamento: acompanhamento, ciencias: ciencias });
                  });
                });
              });
            });
          });
        }).then(function (DadosExtras) {
          $progressbar.progressbar("value", $progressbar.progressbar("value") + progressbar_val);
          console.log($progressbar.progressbar("value"));
          TabelaAdicinarProcesso(processo, DadosExtras);
        });
      }, Promise.resolve());
    }).then(function () {
      /** Adicioan a tabela na tela do sei */
      $tabela.appendTo("#divInfraAreaDados");
      $progressbar.progressbar("destroy");

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
    }).catch(erro => {
      console.log(erro);
      $progressbar.progressbar("destroy");
      $("#progressbar div.progress-label").text("");
      if (erro.message.indexOf("Módulo inativo") != -1) {
        $("#divInfraAreaDados").append(erro.toString() + " Esta funcionalidade necessita que o módulo WebService esteja ativo.");
      } else {
        $("#divInfraAreaDados").append(erro);
      }
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
      $throw.append($("<th/>").text("Anotação").addClass("columnMax150"));
      $throw.append($("<th/>").text("Marcador").addClass("columnMax150"));
      $throw.append($("<th/>").text("Acompanhamento").addClass("columnMax150"));
      $throw.append($("<th/>").text("Ações").addClass("columnNowrap"));
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
      $processo_obs_unidade = $("<div/>");
      if (DadosExtras.dados.ObservacaoOutrasUnidades.length) {
        var obs_unidade = DadosExtras.dados.ObservacaoOutrasUnidades[DadosExtras.dados.ObservacaoOutrasUnidades.length - 1];
        $processo_obs_unidade.text(obs_unidade.observacao).attr("title", "Observação da unidade: " + obs_unidade.unidade);
      } else if (DadosExtras.dados.Observacao != "") {
        $processo_obs_unidade.text(DadosExtras.dados.Observacao).attr("title", "Observação da unidade atual.");
      }
      var $processo = $("<td/>")
        .append($("<div/>")
          .attr("id", "proc" + processo.atributos.idProcedimento)
          .attr("title", processo.atributos.tipoProcesso)
          .append($("<a/>")
            .attr("href", "controlador.php?acao=procedimento_trabalhar&id_procedimento=" + processo.id)
            .attr("target", "_blank")
            .text(processo.atributos.numero)))
        .append($processo_obs_unidade);
      $trrow.append($processo);
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
      if (DadosExtras.acompanhamento.id != -1) {
        $("div[id^='proc']", $trrow).append($("<img/>")
          .attr("src", "imagens/sei_acompanhamento_especial_pequeno.png")
          .attr("title", "Acompanhamento Especial")
        );
      }
      if (DadosExtras.ciencias.length > 0) { /** Ciência */
        var list_ciencia = "";
        var $ciencia = $("<img/>").attr("src", "imagens/sei_ciencia_pequeno.gif");

        DadosExtras.ciencias.forEach(function (ciencia) {
          list_ciencia = list_ciencia.concat(ciencia.nome, " - ", ciencia.data, "\n");
        });
        $ciencia.attr("title", list_ciencia);
        $("div[id^='proc']", $trrow).append($ciencia);
      }
      /** (HIDE)Tipo de processo */
      $trrow.append($("<td/>").text(processo.atributos.tipoProcesso).addClass("columnHide"));

      /** (Anotação) Sugestão de encaminhamento */
      var $anotacao = $("<td/>").attr("idproc", processo.atributos.idProcedimento).attr("prioridade", false);
      if (processo.atributos.anotacoes.length > 0) {
        $anotacao.text(processo.atributos.anotacoes[0].descricao)
          .attr("prioridade", processo.atributos.anotacoes[0].sinPrioridade == "S" ? true : false);
      }
      $anotacao.on("dblclick", dblclick_anotacao);
      $trrow.append($anotacao);

      /** (Marcador) Despacho da autoridade */
      var $marcador = $("<td/>").attr("idproc", processo.atributos.idProcedimento);
      $marcador.append($("<div/>").attr("id", "img")
        .append($("<img/>"))
        .append($("<label/>"))
      );
      $marcador.append($("<div/>").attr("id", "text"));
      if (DadosExtras.processo.Flags.Marcador.Nome != null) {
        $marcador.find("#img > img")
          .attr("src", "imagens/marcador_" + DadosExtras.processo.Flags.Marcador.Cor + ".png")
          .attr("title", DadosExtras.processo.Flags.Marcador.Nome);
        $marcador.find("#img > label")
          .text(DadosExtras.processo.Flags.Marcador.Nome);
        $marcador.find("#text").text(DadosExtras.marcador.texto);
      } else {
        $marcador.find("#img").hide();
      }
      $marcador.on("dblclick", dblclick_marcador);
      $trrow.append($marcador);

      /** Acompanhamento Especial */
      var $acompanhamento = $("<td/>").attr("idproc", processo.atributos.idProcedimento)
        .attr("idacomp", DadosExtras.acompanhamento.id);
      $acompanhamento.append($("<div/>").attr("id", "img")
        .append($("<img/>"))
        .append($("<label/>"))
      );
      $acompanhamento.append($("<div/>").attr("id", "text"));
      if (DadosExtras.acompanhamento.id != -1) {
        $acompanhamento.find("#img > img")
          .attr("src", "imagens/sei_acompanhamento_especial_pequeno.png")
          .attr("title", "Acompanhamento Especial");
        if (DadosExtras.acompanhamento.grupo != null) {
          $acompanhamento.find("#img > label")
            .text(DadosExtras.acompanhamento.grupo.nome);
        }
        $acompanhamento.find("#text").text(DadosExtras.acompanhamento.observacao);
      } else {
        $acompanhamento.find("#img").hide();
      }
      $acompanhamento.on("dblclick", dblclick_acompanhamento);
      $trrow.append($acompanhamento);

      /** Açoes */
      var $acoes = $("<td/>");
      // $acao_ciencia = $("<div/>");
      $acao_concluir = $("<div/>");

      // $acao_ciencia.append($("<img/>").attr("src", "imagens/sei_ciencia_pequeno.gif"))
      //   .attr("idproc", processo.atributos.idProcedimento)
      //   .on("click", click_acao_ciencia);
      $acao_concluir.append($("<img/>").attr("src", "imagens/sei_concluir_processo.gif"))
        .attr("idproc", processo.atributos.numero)
        .on("click", click_acao_concluir);

      $acoes.append($acao_concluir);
      $trrow.append($acoes);

      /** FIM */
      $tbody.append($trrow);
    }

    function dblclick_anotacao() {
      var $dialog = $("<div/>")
        .attr("id", "dblclick_anotacao")
        .attr("title", "Editar anotação")
        .append($("<textarea/>").text($(this).text()).css({ width: "250px", height: "150px", resize: "none" }))
        .append($("<input/>").attr("type", "checkbox"))
        .append($("<label/>").text("Prioridade"));
      var $anotacao = $(this);
      if ($anotacao.attr("prioridade") == "true") $dialog.find("input").attr("checked", "checked");
      $("body").append($dialog);
      $dialog = $dialog.dialog({
        autoOpen: false, height: 270, width: 275, modal: true, resizable: false,
        buttons: {
          Salvar: function () {
            ws_token().then(Login => {
              var data = {
                descricao: $dialog.find("textarea").val(),
                protocolo: $anotacao.attr("idproc"),
                unidade: Login.loginData.IdUnidadeAtual,
                usuario: Login.loginData.IdUsuario,
                prioridade: $dialog.find("input").prop("checked") ? "S" : "N"
              };
              console.log($dialog.find("input[checked]"));
              return ws_post(wsapi.anotacao, data);
            }).then(function (params) {
              console.log(params);
              $anotacao.text($dialog.find("textarea").val());
              if ($dialog.find("input").prop("checked")) {
                $anotacao.attr("prioridade", true);
              } else {
                $anotacao.attr("prioridade", false);
              }
              $dialog.dialog("close");
            }).catch(function (err) {
              alert(err);
            });
          },
          Cancelar: function () {
            $dialog.dialog("close");
          }
        },
        close: function () {
          $dialog.dialog("destroy");
          $("#dblclick_anotacao").remove();
        }
      });
      $dialog.dialog("open");
    }

    function dblclick_marcador() {
      var $select = $("<select/>");
      var $textarea = $("<textarea/>").css({ width: "250px", height: "150px", resize: "none" });
      var $dialog = $("<div/>")
        .attr("id", "dblclick_marcador")
        .attr("title", "Editar Marcador")
        .append($("<label/>").text("Marcador"))
        .append($select)
        .append($textarea);
      var $marcador = $(this);
      $select.append($("<option/>").text("").val(null));
      Marcadores.forEach(function (Marcador) {
        $select.append($("<option/>").text(Marcador.nome).val(Marcador.id));
      });
      $select.find("option").each(function () {
        if ($marcador.find("#img > label").text() == $(this).text()) {
          $(this).attr("selected", "selected");
        }
      });
      $textarea.text($marcador.find("#text").text());
      $("body").append($dialog);
      $dialog = $dialog.dialog({
        autoOpen: false, height: 270, width: 275, modal: true, resizable: false,
        buttons: {
          Salvar: Salvar,
          Cancelar: function () {
            $dialog.dialog("close");
          }
        },
        close: function () {
          $dialog.dialog("destroy");
          $("#dblclick_marcador").remove();
        }
      });
      $dialog.dialog("open");

      function Salvar() {
        var Marcador = {
          id: $select.val(),
          idProcesso: $marcador.attr("idproc"),
          texto: $textarea.val()
        }
        ext_ws_post(seipp_api.processo.marcador, Marcador).then(ret => {
          if (Marcador.id == "") {
            $marcador.find("#img").hide();
            $marcador.find("#text").text("");
          } else {
            var m = Marcadores.find(m => m.id == Marcador.id);
            $marcador.find("#img > img")
              .attr("src", "imagens/marcador_" + m.cor + ".png")
              .attr("title", m.nome);
            $marcador.find("#img > label")
              .text(m.nome);
            $marcador.find("#img").show();
            $marcador.find("#text").text(Marcador.texto);

            /** Atualiza a flag no processo */
            var $flag_marcador = $marcador.parent().find("td:first > div[id^='proc'] > img[src*='imagens/marcador_']");
            if ($flag_marcador.length == 0) {
              $marcador.parent().find("td:first > div[id^='proc']").append($("<img/>")
                .attr("src", "imagens/marcador_" + m.cor + ".png")
                .attr("title", m.nome));
            } else {
              $flag_marcador.attr("src", "imagens/marcador_" + m.cor + ".png")
                .attr("title", m.nome);
            }
          }
          $dialog.dialog("close");
        }).catch(function (err) {
          console.log(err);
          alert(err);
        });
      }
    }

    function dblclick_acompanhamento() {
      var $select = $("<select/>");
      var $textarea = $("<textarea/>").css({ width: "250px", height: "150px", resize: "none" });
      var $dialog = $("<div/>")
        .attr("id", "dblclick_acompanhamento")
        .attr("title", "Editar Marcador")
        .append($("<label/>").text("Marcador"))
        .append($select)
        .append($textarea);
      var $acompanhamento = $(this);
      var id = $acompanhamento.attr("idacomp");
      $select.append($("<option/>").text("").val(null));
      GrupoAcompanhamentos.forEach(function (Grupo) {
        $select.append($("<option/>").text(Grupo.nome).val(Grupo.id));
      });
      $select.find("option").each(function () {
        if ($acompanhamento.find("#img > label").text() == $(this).text()) {
          $(this).attr("selected", "selected");
        }
      });
      $textarea.text($acompanhamento.find("#text").text());
      $("body").append($dialog);
      $dialog = $dialog.dialog({
        autoOpen: false, height: 270, width: 275, modal: true, resizable: false,
        buttons: {
          Excluir: Excluir,
          Salvar: Salvar,
          Cancelar: function () {
            $dialog.dialog("close");
          }
        },
        close: function () {
          $dialog.dialog("destroy");
          $("#dblclick_acompanhamento").remove();
        }
      });
      $dialog.dialog("open");

      function Salvar() {
        var Acompanhamento = {
          grupo: $select.val(),
          protocolo: $acompanhamento.attr("idproc"),
          observacao: $textarea.val()
        }
        var ws;
        if (id == -1) { /** Novo acompanhamento */
          ws = ws_post(wsapi.processo.acompanhar, Acompanhamento);
        } else { /** Alterar acompanhamento */
          var acomp = {
            id: id,
            idProcesso: Acompanhamento.protocolo,
            grupo: Acompanhamento.grupo,
            observacao: Acompanhamento.observacao
          }
          ws = ext_ws_post(seipp_api.processo.acompanhamento, acomp);
          console.log("Alterar o acompanhamento");
        }
        ws.then(ret => {
          if (Acompanhamento.grupo == "null") {
            $acompanhamento.find("#text").text("");
          } else {
            var m = GrupoAcompanhamentos.find(m => m.id == Acompanhamento.grupo);
            $acompanhamento.find("#img > img")
              .attr("src", "imagens/sei_acompanhamento_especial_pequeno.png")
              .attr("title", "Acompanhamento Especial");

            $acompanhamento.find("#img > label").text(m == undefined ? "" : m.nome);
            $acompanhamento.find("#img").show();
            $acompanhamento.find("#text").text(Acompanhamento.observacao);

            /** Atualiza a flag no processo */
            var $flag_acompanhamento = $acompanhamento.parent().find("td:first > div[id^='proc'] > img[src*='sei_acompanhamento_especial_pequeno']");
            if ($flag_acompanhamento.length == 0) {
              $acompanhamento.parent().find("td:first > div[id^='proc']").append($("<img/>")
                .attr("src", "imagens/sei_acompanhamento_especial_pequeno.png")
                .attr("title", "Acompanhamento Especial"));
            }
          }
          $dialog.dialog("close");
        }).catch(function (err) {
          console.log(err);
          alert(err);
        });
      }

      function Excluir() {
        alert("não implementado");
      }
    }

    // function click_acao_ciencia() {
    //   var $acao_ciencia = $(this);
    //   ws_post(wsapi.processo.ciencia, null, $acao_ciencia.attr("idproc")).then(resp => {
    //     /** Atualiza a flag no processo */
    //     var $flag_ciencia = $acao_ciencia.parent().parent().find("td:first > div[id^='proc'] > img[src*='sei_ciencia_pequeno']");
    //     if ($flag_ciencia.length == 0) {
    //       $flag_ciencia = $("<img/>").attr("src", "imagens/sei_ciencia_pequeno.gif");
    //       $acao_ciencia.parent().parent().find("td:first > div[id^='proc']").append($flag_ciencia);
    //     }
    //     ws_get(wsapi.processo.listar_ciencia, null, $acao_ciencia.attr("idproc")).then(ciencias => {
    //       if (ciencias.length > 0) { /** Ciência */
    //         var list_ciencia = "";

    //         ciencias.forEach(function (ciencia) {
    //           list_ciencia = list_ciencia.concat(ciencia.nome, " - ", ciencia.data, "\n");
    //         });
    //         $flag_ciencia.attr("title", list_ciencia);
    //       }
    //     });
    //     alert("Ciência registrada para o processo");
    //   }).catch(err => {
    //     console.error(err);
    //     alert(err);
    //   });
    // }
    function click_acao_concluir() {
      var $acao_concluir = $(this);
      var nprocesso = $acao_concluir.attr("idproc");
      ws_post(wsapi.processo.concluir, { numeroProcesso: nprocesso }).then(resp => {
        /** Remove o processo da tabela */
        $acao_concluir.parent().parent().remove();
        $tabela.trigger("update");

        alert("Processo concluído");
      }).catch(err => {
        alert(err);
      });
    }

  };

  return data;
}