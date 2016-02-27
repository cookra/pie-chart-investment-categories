Ext.define('CustomApp', {
    extend: 'Rally.app.App',
    categories:[],
    launch: function() {
        this._myMask = new Ext.LoadMask(Ext.getBody(), {msg:"Please wait.This may take long depending on your data..."});
        this._myMask.show();
        this.loadCategories().then({
            success:function(){
                this.makeComponents();
            },
            scope: this
        });
    },
    loadCategories:function(){
        return Rally.data.ModelFactory.getModel({
            type: 'PortfolioItem',
            success: function(model){
                model.getField('InvestmentCategory').getAllowedValueStore().load({
                    callback: function(records){
                        //this.categories = _.rest(_.invoke(records, 'get', 'StringValue')); //remove first element, 'none'.
                        this.categories = _.invoke(records, 'get', 'StringValue');
                    },
                    scope:this
                });
            },
            scope:this
        });
    },
    makeComponents:function(){
        this.add({
            xtype: 'rallyreleasecombobox',
            itemId: 'releaseComboBox',
            fieldLabel: 'Filter by Release:',
            context: this.getContext().getDataContext(),
            listeners: {
                ready: this.getFeaturesInRelease,
                select: this.getFeaturesInRelease,
                scope: this
            }
        });
    },

    getFeaturesInRelease: function(release) {
        var releaseRef = release.getValue();
        console.log('release', releaseRef);
        console.log(this.getContext().getDataContext());
        var store = Ext.create('Rally.data.wsapi.Store', {
            model:'portfolioitem/feature',
            autoLoad:true,
            limit:Infinity,
            fetch:['FormattedID','Name','Project','InvestmentCategory'],
            filters: [
                {
                    property: 'Release',
                    value: releaseRef
                }
            ],
            listeners:{
                load:function(store, records) {
                    this.processResults(store, records);
                },
                scope:this
            },
            context:this.getContext().getDataContext()
        });
    },
    processResults:function(store, records){
        console.log('categories',this.categories);
        _.each(records, function(record){
            console.log('FormattedID: ', record.get('FormattedID'),
                        'Name', record.get('Name'),
                        'InvestmentCategory:',record.get('InvestmentCategory') );
        });
        var countByCategory = {};
        var categoryColors = {};
        var colors = ['#98FB98','#90EE90','#6B8E23','#8FBC8F','#00FF7F','#556B2F','#3CB371','#2E8B57','#228B22','#006400','#008080'];
        var pieData = [];
        var i = 0;
        
        _.each(this.categories, function(category){
            countByCategory[category] = 0;
        });
        
        _.each(records, function(record){
            category = record.get('InvestmentCategory');
            if (category === 'None') {
                countByCategory['']++;
            }
            countByCategory[category]++;
        });
        console.log('countByCategory', countByCategory);
        var arrOfCategories = this.sortCategories(countByCategory);
        console.log(arrOfCategories);
        _.each(this.categories, function(category){
            var obj = _.find(arrOfCategories, function(o) { return o.key === category; });
            var color = '#D3D3D3'
            if (category !== '') {
                var index = _.findIndex(arrOfCategories, function(o) { return o.key === category; });
                color =  colors[index];
            }
            
            pieData.push({
                name: category,
                y: obj.value,
                color: color
            });
            
        });
        if (this.down('#piByCategory')) {
	    this.remove('piByCategory');
	}
        this._myMask.hide();
        this.add({
            xtype: 'rallychart',
            height:400,
            storeType:'Rally.data.wsapi.Store',
            store:  store,
            itemId: 'piByCategory',
            chartConfig:{
                chart:{},
                title:{
                    text: 'Features By Category' ,
                    align: 'center'
                },
                tooltip:{
                    formatter: function(){
                        return this.point.name + ': <b>' + Highcharts.numberFormat(this.percentage, 1) + '%</b><br />Count: ' + this.point.y;
                    }
                },
                plotOptions:{
                    pie:{
                        allowPointSelect:true,
                        cursor: 'pointer',
                        dataLabels:{
                            enabled:true,
                            color: '#000000',
                            connectorColor: '#000000'
                        }
                    }
                }
            },
            chartData:{
                categories: category,
                series:[
                    {
                        type:'pie',
                        name:'Investement Categories',
                        data: pieData
                    }
                ]
            }
        });
        this.down('#piByCategory')._unmask();
    },
    sortCategories:function(obj){
        var arr = [];
        for (var prop in obj) {
            if (obj.hasOwnProperty(prop)) {
                arr.push({
                    'key': prop,
                    'value': obj[prop]
                });
            }
        }
        arr.sort(function(a, b) { return a.value - b.value; });
        return arr;   
    }
});