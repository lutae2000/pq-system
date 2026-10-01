FROM amazoncorretto:25 AS builder

WORKDIR /app

COPY build/libs/app.jar app.jar

# Keep dependency layers stable between application releases. Spring Boot 4
# provides the tools jarmode for extracting the layered bootJar.
RUN java -Djarmode=tools -jar app.jar extract --layers --launcher --destination extracted

FROM amazoncorretto:25

WORKDIR /app

COPY --from=builder /app/extracted/dependencies/ ./
COPY --from=builder /app/extracted/spring-boot-loader/ ./
COPY --from=builder /app/extracted/snapshot-dependencies/ ./
COPY --from=builder /app/extracted/application/ ./

EXPOSE 8080

ENTRYPOINT ["java", "org.springframework.boot.loader.launch.JarLauncher"]
