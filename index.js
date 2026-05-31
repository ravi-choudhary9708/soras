class apiError extends Error{
    constructor(statusCode,message){
        super(message);
        this.statusCode=statusCode;
        this.message=message;
    }   
    toJSON(){
        return {
            statusCode:this.statusCode,
            message:this.message,
        }
    }
}

const error= new apiError(401,"all feild is required");
console.log(JSON.stringify(error));