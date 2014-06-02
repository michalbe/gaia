'use strict';
/* global _ */
/* exported TAG_OPTIONS */

console.log('TAG OPTIONS FILE LOADED');

var GET_TAG_OPTIONS = function() {
  return {
    get 'phone-type'() {
      return [
        {type: 'mobile', value: _('mobile')},
        {type: 'home', value: _('home')},
        {type: 'work', value: _('work')},
        {type: 'personal', value: _('personal')},
        {type: 'faxHome', value: _('faxHome')},
        {type: 'faxOffice', value: _('faxOffice')},
        {type: 'faxOther', value: _('faxOther')},
        {type: 'other', value: _('other') }
      ];
    },
    get 'email-type'() {
      return [
        {type: 'personal', value: _('personal')},
        {type: 'home', value: _('home')},
        {type: 'work', value: _('work')},
        {type: 'other', value: _('other')}
      ];
    },
    get 'address-type'() {
      return [
        {type: 'current', value: _('current')},
        {type: 'home', value: _('home')},
        {type: 'work', value: _('work')}
      ];
    },
    get 'date-type'() {
      return [
        {type: 'birthday', value: _('birthday')},
        {type: 'anniversary', value: _('anniversary')}
      ];
    }
  };
};

var TAG_OPTIONS = GET_TAG_OPTIONS();
