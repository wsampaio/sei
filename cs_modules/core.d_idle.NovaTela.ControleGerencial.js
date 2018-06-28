function ControleGerencial() {
  var data = {
    MenuId: "menu-gerencial",
    MenuTexto: "Controle Gerencial",
    MenuAcao: null
  };

  data.MenuAcao = function (mconsole) {
    mconsole.log("Execução da ação");

    $("#divInfraAreaDados").text(data.MenuTexto);
  };

  return data;
}