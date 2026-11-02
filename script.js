$(function () {
  const g = (name, color, time, aitu, items = '') => ({name, color, time, aitu, items: items ? items.split(' ') : []});
  const rooms = [
    {name:'Balcony', floor:2, guests:[
      g('Aigerim','green','20:45',true,'cup crumbs'), g('Aliya','black','21:15',false,'phone cup'),
      g('Madina','green','22:10',false,'phone bag crumbs'), g('Ivan','black','20:10',true,'cup')]},
    {name:'Hall', floor:2, guests:[
      g('Arman','yellow','20:35',false,'bag glasses'), g('Sophia','purple','21:20',true,'phone'),
      g('Dias','green','19:45',true), g('Bekzat','purple','20:55',false,'bag cup crumbs'),
      g('Aruzhan','blue','21:50',true,'phone'), g('Saule','green','21:25',false,'glasses')]},
    {name:'Kitchen', floor:1, guests:[
      g('Nurlan','red','19:40',true,'phone cup'), g('Emma','black','20:15',false,'bag'),
      g('Timur','green','21:05',true,'phone bag crumbs'), g('Sergey','yellow','20:50',false),
      g('Yerlan','red','21:40',true,'glasses phone'), g('Kamila','green','20:05',false,'cup')]},
    {name:'Living room', floor:1, guests:[
      g('Daniel','blue','19:55',true,'glasses'), g('Zarina','green','21:10',false,'bag phone crumbs'),
      g('Natasha','yellow','20:30',true), g('Askar','black','21:00',true,'phone'), g('Inkar','purple','20:20',false,'bag')]}
  ];
  const icons = {phone:'📱',glasses:'👓',bag:'👜',cup:'☕',crumbs:'🍰'};
  const titles = ['Who is in the hall?','Who wears yellow or purple?','Which AITU students are upstairs?',
    'Who has glasses or a bag?','Who came with nothing?','Who has a phone but no bag?',
    'Who arrived from 20:30 to 21:00?','Who arrived after 21:00 and is not AITU?',
    'Who stands next to Askar?','Who stands last in each room?','Who stands third in each room?',
    'Who stands after Timur?','Who stands before someone in black?','In which room is Aruzhan?',
    'Which rooms have fewer than 6 guests?','Cup but nobody with glasses?','Who came first to each room?',
    'Miras joins the living room','Natasha goes home','Who took the cake?'];
  const $house = $('.house'), $modal = $('#guestModal'), $backdrop = $('#modalBackdrop');
  const find = selector => $house.find(selector);
  const cardFor = name => find('.guest[data-name="'+name+'"]');
  let opened = null, origin = null, pending = null;
  rooms.forEach(r => { r.id = r.name.toLowerCase().replaceAll(' ','-'); r.next = r.guests.length; r.guests.forEach((p,i) => p.order = i); });
  const initial = $.extend(true, [], rooms);

  function guestCard(p) {
    return $(`<div class="guest ${p.color}" data-name="${p.name}" data-time="${p.time}" data-aitu="${p.aitu}" data-color="${p.color}" tabindex="0" role="button" aria-label="${p.name}">
      <img class="avatar" src="avatars/${p.name}.svg" alt="${p.name}" style="--ring:${p.color}">
      <span class="guest-name">${p.name}</span><div class="guest-time">◷ ${p.time}</div>
      <div class="items">${p.items.map(i => `<span class="item item-${i}" title="${i}">${icons[i]}</span>`).join('')}</div>
      ${p.aitu ? '<span class="aitu-badge" title="AITU student">A</span>' : ''}</div>`).data('guest',p);
  }
  function renderHouse() {
    $('#upstairs,#downstairs').empty();
    rooms.forEach(r => {
      const $room = $(`<div class="room" data-room="${r.id}" data-floor="${r.floor}"><h3>${r.name}</h3><div class="guest-list"></div><button class="sort-btn">${r.sorted ? 'Picture order' : 'Sort by time'}</button></div>`).data('room',r);
      r.guests.forEach(p => $room.find('.guest-list').append(guestCard(p)));
      $(r.floor === 2 ? '#upstairs' : '#downstairs').append($room);
    });
  }
  // Each case is one jQuery chain that searches the page.
  const queries = [
    () => find('[data-room="hall"] .guest'),
    () => find('.guest.yellow, .guest.purple'),
    () => find('[data-floor="2"] .guest[data-aitu="true"]'),
    () => find('.guest:has(.item-glasses), .guest:has(.item-bag)'),
    () => find('.guest:not(:has(.item))'),
    () => find('.guest:has(.item-phone):not(:has(.item-bag))'),
    () => find('.guest').filter(function () { return this.dataset.time >= '20:30' && this.dataset.time <= '21:00'; }),
    () => find('.guest[data-aitu="false"]').filter(function () { return this.dataset.time > '21:00'; }),
    () => cardFor('Askar').prev('.guest').add(cardFor('Askar').next('.guest')),
    () => find('.guest:last-child'),
    () => find('.guest:nth-child(3)'),
    () => cardFor('Timur').nextAll('.guest'),
    () => find('.guest.black').prev('.guest'),
    () => cardFor('Aruzhan').closest('.room'),
    () => find('.room').filter(function () { return $(this).find('.guest').length < 6; }),
    () => find('.room:has(.item-cup):not(:has(.item-glasses))'),
    () => find('.guest').filter(function () { const t = this.dataset.time; return !$(this).siblings('.guest').filter(function () { return this.dataset.time < t; }).length; }),
    () => guestCard({...g('Miras','blue','21:20',true,'phone'),order:cardFor('Askar').data('guest').order+.5}).hide().insertAfter(cardFor('Askar')).fadeIn(300),
    () => cardFor('Natasha').addClass('leaving').attr('tabindex',-1).animate({top:-8},130).animate({top:0},130).fadeOut(300,function () { $(this).remove(); }),
    () => find('[data-floor="1"] .guest:has(.item-crumbs):not(:has(.item-cup))').filter(function () { return this.dataset.time > '21:00' && this.dataset.time < '21:30'; }).filter(function () { return $(this).prev('[data-aitu="true"]').add($(this).next('[data-aitu="true"]')).length; })
  ];
  function finishLayout() {
    $('.flight,.gap').stop(true,false).remove();
    find('.guest').stop(true,true).css({visibility:'',width:'',top:0,left:0});
  }
  function clear() {
    finishLayout(); closeModal(true);
    find('.guest').removeClass('highlight').fadeTo(300,1);
    find('.room').removeClass('highlight'); $('.case-btn').removeClass('active');
    $('#mobileCases').val(''); $('.case-status').text('READY WHEN YOU ARE'); $('#result').text('Open a case file to start the investigation.'); $('#query').empty();
  }
  titles.forEach((t,i) => $('#caseButtons').append($('<button>',{class:'case-btn','data-case':i+1,html:`<span class="case-num">${String(i+1).padStart(2,'0')}</span><span class="case-label">${t}</span>`})));
  $('#caseButtons').on('click','.case-btn',function () {
    finishLayout(); closeModal(true); renderHouse();
    const n = Number($(this).data('case')), $found = queries[n-1]();
    $('.case-status').text('CASE '+String(n).padStart(2,'0')+' / 20');
    const isRoom = $found.is('.room'), $people = isRoom ? $found.find('.guest') : $found;
    $('.case-btn').removeClass('active'); $(this).addClass('active');
    $found.add($people).addClass('highlight');
    find('.guest').not($people).fadeTo(300,.2);
    if(n !== 19) $people.animate({top:-8},130).animate({top:0},130);
    const names = $found.map(function () { return isRoom ? $(this).find('h3').text() : this.dataset.name; }).get();
    $('#result').text((isRoom ? 'Rooms' : 'Guests')+': '+$found.length+' · '+(names.join(', ') || 'None'));
    $('#query').text(queries[n-1].toString());
    $('#mobileCases').val(n);
    $('html,body').stop(true).animate({scrollTop:$('.workspace').offset().top-20},250);
  });
  $('#clearBtn').on('click',clear);
  $('#resetBtn').on('click',function () { clear(); rooms.splice(0,rooms.length,...$.extend(true,[],initial)); renderHouse(); });

  // Fixed coordinates must be relative to the viewport, including after scrolling.
  function position($element) {
    const p = $element.offset(); return {left:p.left-$(window).scrollLeft(),top:p.top-$(window).scrollTop()};
  }
  function closeModal(now = false) {
    pending = null;
    if(!opened) return;
    $modal.stop(true,false);
    const done = () => {
      $backdrop.hide(); $modal.empty(); opened = null;
      const next = pending; pending = null;
      if(next) openModal(next);
    };
    if(now) done();
    else $modal.animate({...position(origin),width:58,height:58,opacity:0},180,done);
  }
  function openModal($card) {
    if(opened) { closeModal(); pending = $card; return; }
    const p = $card.data('guest'), room = $card.closest('.room').data('room');
    opened = p; origin = $card.find('.avatar');
    $modal.html(`<button class="close-btn" aria-label="Close">×</button>
      <div class="modal-head"><img src="avatars/${p.name}.svg" alt="${p.name}" style="--ring:${p.color}"><div><h2>${p.name}</h2><small>${room.name}</small></div></div>
      <p>Came at ${p.time}. ${p.aitu ? 'AITU student.' : 'Not an AITU student.'}</p>
      <p>Clothing: ${p.color}. Has: ${p.items.join(', ') || 'nothing'}.</p><b>Move to:</b>
      <div class="modal-actions">${rooms.filter(r => r !== room).map(r => `<button class="move-btn" data-room="${r.id}">${r.name}</button>`).join('')}</div>`);
    $backdrop.show();
    const width = Math.min(420,$(window).width()-30), height = Math.min(300,$(window).height()-30);
    $modal.css({...position(origin),width:58,height:58,opacity:0}).animate({left:($(window).width()-width)/2,top:($(window).height()-height)/2,width,height,opacity:1},250);
    $modal.find('.close-btn').trigger('focus');
  }
  $house.on('click','.guest',function () { openModal($(this)); });
  $house.on('keydown','.guest',function (e) { if(e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openModal($(this)); } });
  $modal.on('click','.close-btn',() => closeModal());
  $backdrop.on('click',function (e) {
    if(e.target !== this) return;
    $backdrop.hide(); const $card = $(document.elementFromPoint(e.clientX,e.clientY)).closest('.house .guest'); $backdrop.show();
    if($card.length && !$card.hasClass('leaving')) openModal($card); else closeModal();
  });
  $(document).on('keydown',e => { if(e.key === 'Escape') closeModal(); });

  function fly($card) {
    return $card.clone().removeAttr('tabindex').attr('aria-hidden','true').addClass('flight')
      .css({...position($card),width:$card.outerWidth(),height:$card.outerHeight(),opacity:1}).appendTo('body');
  }
  $modal.on('click','.move-btn',function () {
    const p = opened, to = rooms.find(r => r.id === $(this).data('room'));
    closeModal(true); finishLayout();
    const $card = cardFor(p.name), from = $card.closest('.room').data('room');
    const $copy = fly($card), width = $card.outerWidth();
    const $gap = $('<div>',{class:'gap'}).css({width,height:$card.outerHeight()}).insertBefore($card);
    from.guests = from.guests.filter(g => g.name !== p.name);
    p.order = to.next++; to.guests.push(p); from.sorted = to.sorted = false;
    find(`[data-room="${from.id}"] .sort-btn, [data-room="${to.id}"] .sort-btn`).text('Sort by time');
    $card.appendTo(find(`[data-room="${to.id}"] .guest-list`)).css('visibility','hidden');
    const end = position($card);
    $card.css('width',0).animate({width},450);
    $gap.animate({width:0},450,() => $gap.remove());
    $copy.animate(end,450,function () { $copy.remove(); $card.css({visibility:'',width:''}); });
    $('#result').text(p.name+' moved to '+to.name); $('#query').empty();
  });
  $house.on('click','.sort-btn',function () {
    finishLayout(); closeModal(true);
    const $room = $(this).closest('.room'), room = $room.data('room'), $list = $room.find('.guest-list');
    const flights = $list.children().map(function () { return {card:$(this),copy:fly($(this))}; }).get();
    room.sorted = !room.sorted;
    room.guests.sort(room.sorted ? (a,b) => a.time.localeCompare(b.time) : (a,b) => a.order-b.order);
    // Include a temporary Miras card from case 18 in the visual ordering too.
    const cards = $list.children().get().sort((a,b) => room.sorted ? a.dataset.time.localeCompare(b.dataset.time) : ($(a).data('guest').order ?? Infinity)-($(b).data('guest').order ?? Infinity));
    $list.append(cards);
    flights.forEach(f => {
      const end = position(f.card); f.card.css('visibility','hidden');
      f.copy.animate(end,400,() => { f.copy.remove(); f.card.css('visibility',''); });
    });
    $(this).text(room.sorted ? 'Picture order' : 'Sort by time');
  });
  titles.forEach((t,i) => $('#mobileCases').append($('<option>',{value:i+1,text:(i+1)+'. '+t})));
  $('#mobileCases').on('change',function () { if(this.value) $('.case-btn[data-case="'+this.value+'"]').trigger('click'); });
  renderHouse();
});
