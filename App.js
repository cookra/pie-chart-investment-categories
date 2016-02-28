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
                        this.categories = _.rest(_.invoke(records, 'get', 'StringValue')); //remove first element, 'none'.
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
        var piData = [];
        
        _.each(this.categories, function(category){
            countByCategory[category] = 0;
        });
        
        _.each(records, function(record){
            category = record.get('InvestmentCategory');
            countByCategory[category]++;
        });
        _.each(this.categories, function(category){
            var color = this.pickColor(category);
            piData.push({
                name: category,
                y: countByCategory[category],
                color: color
            });
            
        },this);
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
                        data: piData
                    }
                ]
            }
        });
        this.down('#piByCategory')._unmask();
    },
    pickColor:function(category){
        var color = '';
        switch (category) {
            case 'Architecture':
                color = '#228B22';
                break;
            case 'Sustaninability':
                color = '#006400';
                break;
            case 'KTLO':
                color = '#ADFF2F';
                break;
            case 'Strategic':
                color = '#00FF7F';
                break;
            case 'User Focused':
                color = '#9ACD32';
                break;
            case 'Research':
                color = '#66CDAA';
                break;
            case 'Connectors & On Prem (H1)':
                color = '#20B2AA';
                break;
            case 'UX':
                color = '#9ACD32';
                break;
            case 'Initiatives':
                color = '#6495ED';
                break;
            case 'Defects':
                color = '#CD853F';
                break;
            case 'Customer Voice':
                color = '#D2691E';
                break;
            case '':
                color = '#DCDCDC';
                break;
            default:
                color = '#7CFC00';
        }
        return color;
    }
});