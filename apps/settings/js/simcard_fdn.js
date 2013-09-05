/* -*- Mode: js; js-indent-level: 2; indent-tabs-mode: nil -*- */
/* vim: set shiftwidth=2 tabstop=2 autoindent cindent expandtab: */

'use strict';

var SimFdnLock = {
  dialog: document.getElementById('call-pin2-dialog'),
  simFdnDesc: document.querySelector('#fdn-enabled small'),
  simFdnCheckBox: document.querySelector('#fdn-enabled input'),
  changeSimFdnItem: document.getElementById('fdn-changePIN'),
  changeSimFdnButton: document.querySelector('#fdn-changePIN button'),

  updateFdnStatus: function spl_updateSimStatus() {
    var self = this;
    var req = IccHelper.getCardLock('fdn');
    req.onsuccess = function spl_checkSuccess() {
      var enabled = req.result.enabled;
      localize(self.simFdnDesc, (enabled ? 'enabled' : 'disabled'));
      self.simFdnCheckBox.disabled = false;
      self.simFdnCheckBox.checked = enabled;
      self.changeSimFdnItem.hidden = !enabled;
    };
  },

  init: function spl_init() {
    if (!IccHelper.enabled)
      return;

    var callback = this.updateFdnStatus.bind(this);
    IccHelper.addEventListener('cardstatechange', callback);

    var pinDialog = new SimPinDialog(this.dialog);

    this.simFdnCheckBox.onchange = function spl_toggleSimFdn() {
      var action = this.checked ? 'enableFdn' : 'disableFdn';
      if (IccHelper.cardState === 'puk2Required') {
        action = 'unlockFdn';
        return; // TODO (not implemented yet, early way out)
      }
      pinDialog.show(action, callback, callback);
    };

    this.changeSimFdnButton.onclick = function spl_changePin2() {
      pinDialog.show('changePin2');
    };

    this.updateFdnStatus();
  }
};

navigator.mozL10n.ready(SimFdnLock.init.bind(SimFdnLock));

