Ext.define('CustomApp', {
    extend: 'Rally.app.App',
    categories:[],
    launch: function() {
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
                    this.processResults(records);
                },
                scope:this
            },
            context:this.getContext().getDataContext(),
        });
    },
    processResults:function(records){
        console.log('categories',this.categories);
        _.each(records, function(record){
            console.log('FormattedID: ', record.get('FormattedID'),
                        'Name', record.get('Name'),
                        'InvestmentCategory:',record.get('InvestmentCategory') );
        });
        
    }
});