
var dados = "";
var correPaginas = false;

$("#divInfraBarraLocalizacao").append(
"<hr><textarea id='areaDeCopia'></textarea><hr>" +
"<button id='copiarTudo' style='display:none;'>Copiar Tudo</button>"
);

$("#copiarTudo").on("click", function(){
	navigator.clipboard.writeText("funcCopiar" + dados);
	document.getElementById("lnkInfraProximaPaginaSuperior").click();
});

navigator.clipboard.readText().then(text => {

	dados = text;

	if ($("#selInfraPaginacaoSuperior").val() == 0){
		navigator.clipboard.writeText("");
		$("#areaDeCopia").append(
			"Processo;" +
			"Tipo;" +
			"Unidade\n"
		);
		$("#copiarTudo").css("display", "block");
	} else {
		if (text.substr(0,10) == "funcCopiar"){
			correPaginas = true;
			$("#areaDeCopia").append(text.substr(10));
			dados = text.substr(10);
		}
	}




	for (let obj of $(".protocoloNormal")) {
		$("#areaDeCopia").append(
			$(obj).html() + ";" +
			$(obj).attr("title") + ";" +
			$($(obj).parent().siblings()[2]).find("a").html() + "" +
			"\n" 
		);
	}

	var copyText = document.getElementById("areaDeCopia");
  /* Select the text field */
  copyText.select();
  copyText.setSelectionRange(0, 999999999); /*For mobile devices*/
  /* Copy the text inside the text field */
  document.execCommand("copy");
	dados = copyText.value;
	navigator.clipboard.writeText(dados);
	//alert("texto copiado\n" + copyText.value)

	if($("#lnkInfraProximaPaginaSuperior").length == 0){
		correPaginas = false;
		alert("dados copiados");
	}



	if (correPaginas){
		navigator.clipboard.writeText("funcCopiar" + dados);
		document.getElementById("lnkInfraProximaPaginaSuperior").click();
	}

	//$("#copiarTudo").css("display", "block");
	
	
});


