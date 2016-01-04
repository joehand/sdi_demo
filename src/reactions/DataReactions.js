'use strict';

import State from '../state/AppState';
import api from '../api/api';
import { mergeAllDataLayers } from '../components/utils';

import topojson from 'topojson';

State
  .on('data:fetch', function(){
    const state = State.get();
    const url = state.dataInfo.url;
    api.getDataUrl(url, function(data) {
      // TODO support geojson + topojson

      // Topojson support:
      // TODO: objects.myKey will change for topojson files
      data = topojson.feature(data,data.objects.collection);

      // Geojson support:
      // data = data WHOA!

      if ('sourceData' in state) {
          state.sourceData.set(url, data);
      } else {
          const obj = {}
          obj[url] = data
          state.set('sourceData', obj);
      }
      State.trigger('data:combineLayes');
    });
  })
;

State
  .on('data:combineLayes', function(){
    const state = State.get()
    const layers = mergeAllDataLayers(state.sourceData);
    state.set('activeData', {'default':layers, 'filtered':layers});

    State.trigger('app:ready'); //TODO move this out
  })
;

State
  .on('data:regexFilter', function(val){
    const state = State.get()
    const data = state.activeData.default;

    if (val) {
      const regex = new RegExp(val, 'i');
      const filteredData = data.features.filter(function(feature) {

        //TODO: Let's not do this...
        let searchText = ''; // Make sure it is string by adding
        if ('filterProp' in State.get().dataInfo) {
          let propName = State.get().dataInfo.filterProp;
          searchText += feature.properties[propName];
        }
        else if ('title' in feature.properties) {
          searchText += feature.properties.title;
        }
        else {
          const obj = feature.properties;
          searchText += obj[Object.keys(obj)[0]];
        }
        return (searchText.search(regex) > -1);
      });

      let filtered = {
          features: filteredData,
          type:data.type
      }

      if (!filteredData.length) {
        //TODO: Deal with no results
        state.set('pageTitle', 'No Results');
      }
      else if (filteredData.length == 1) {
        State.trigger('clicked:feature', filteredData[0])
      } else {
        const pageTitle = filteredData.length + ' Search Results';
        state.set('pageTitle', pageTitle);
      }
      state.activeData.set('filtered', filtered);
    }
    else {
      state.set('pageTitle', 'Search...');
      state.activeData.set('filtered', data);
    }
  })
;


