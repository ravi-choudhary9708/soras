class apiResponse{
    constructor(statusCode,data,message="success",){
        this.statusCode=statusCode
        this.data=data
        this.message=message
        this.success=statusCode<400
    }
    toJSON(){
        return {
            statusCode:this.statusCode,
            data:this.data,
            message:this.message,
            success:this.success,
        }
    }
}

export {apiResponse}