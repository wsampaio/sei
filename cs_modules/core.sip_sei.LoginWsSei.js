const ModName_SipSei = "core.sip_sei.LoginWsSei";

if (ModuleInit(ModName_SipSei)) {
  var mconsole = new __mconsole(ModName_SipSei);
  var $form = $("form[name='frmLogin']");
  $form.on("submit", function (event) {
    $form.off("submit");

    ws_autenticar().then(function (data) {
      mconsole.log("Autenticado no wssei");
    }).catch(console.error);

    return true;
  });
}