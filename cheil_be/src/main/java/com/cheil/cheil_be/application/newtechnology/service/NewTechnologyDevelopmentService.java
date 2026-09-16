package com.cheil.cheil_be.application.newtechnology.service;

import com.cheil.cheil_be.adapter.in.web.newtechnology.NewTechnologyDevelopmentRequest;
import com.cheil.cheil_be.adapter.in.web.newtechnology.NewTechnologyDevelopmentResponse;
import com.cheil.cheil_be.application.newtechnology.port.out.NewTechnologyDevelopmentRepository;
import com.cheil.cheil_be.common.file.FileAttachmentService;
import com.cheil.cheil_be.common.security.AuditActorResolver;
import com.cheil.cheil_be.common.text.StringValues;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Service
@RequiredArgsConstructor
public class NewTechnologyDevelopmentService {
    private static final int CODE_MAX_LENGTH=100, TITLE_MAX_LENGTH=500;
    private static final String ATTACHMENT_OWNER_TYPE="NEW_TECHNOLOGY_DEVELOPMENT";
    private static final DateTimeFormatter DATE_FORMATTER=DateTimeFormatter.BASIC_ISO_DATE;
    private final FileAttachmentService fileAttachmentService;
    private final NewTechnologyDevelopmentRepository repository;

    @Transactional(readOnly=true)
    public Page<NewTechnologyDevelopmentResponse> findAll(String keyword,String technologyType,String targetField,String applicationDateFrom,String applicationDateTo,Boolean useYn,String scoreReferenceDate,Pageable pageable){
        LocalDate reference=referenceDate(scoreReferenceDate); Page<NewTechnologyDevelopmentRepository.Record> page=repository.findAll(keyword,technologyType,targetField,date(applicationDateFrom,"applicationDateFrom",false),date(applicationDateTo,"applicationDateTo",false),useYn,pageable);
        List<NewTechnologyDevelopmentResponse> rows=page.getContent().stream().map(row->response(row,reference)).toList(); return new PageImpl<>(rows,pageable,page.getTotalElements());
    }
    @Transactional(readOnly=true) public NewTechnologyDevelopmentResponse findById(Long id){return findById(id,null);}
    @Transactional(readOnly=true) public NewTechnologyDevelopmentResponse findById(Long id,String scoreReferenceDate){if(id==null)throw invalid("id is required."); NewTechnologyDevelopmentRepository.Record row=repository.findById(id); if(row==null)throw notFound(); return response(row,referenceDate(scoreReferenceDate));}
    @Transactional public NewTechnologyDevelopmentResponse create(NewTechnologyDevelopmentRequest request){validate(request);Long id=repository.create(normalize(request),AuditActorResolver.resolve());return findById(id);}
    @Transactional public NewTechnologyDevelopmentResponse update(Long id,NewTechnologyDevelopmentRequest request){findById(id);validate(request);if(repository.update(id,normalize(request),AuditActorResolver.resolve())!=1)throw notFound();return findById(id);}
    @Transactional public void delete(Long id){findById(id);fileAttachmentService.deleteAll(ATTACHMENT_OWNER_TYPE,String.valueOf(id));if(repository.delete(id)!=1)throw notFound();}

    private NewTechnologyDevelopmentResponse response(NewTechnologyDevelopmentRepository.Record r,LocalDate reference){BigDecimal elapsed=elapsed(r.applicationDate(),reference);return new NewTechnologyDevelopmentResponse(r.id(),r.sequenceLabel(),r.title(),r.technologyType(),r.applicantCount(),r.useYn(),r.applicationDate(),elapsed,score(r.calculatedScore(),r.technologyType(),r.applicantCount(),elapsed),r.targetField(),r.applicationNo(),r.registrationNo(),r.validUntil(),r.summary(),r.remark(),r.createdAt(),r.createdId(),r.lastChangedAt(),r.lastChangedId());}
    private BigDecimal elapsed(String value,LocalDate reference){if(!StringUtils.hasText(value))return null;long days=ChronoUnit.DAYS.between(LocalDate.parse(value,DATE_FORMATTER),reference);if(days<0)return BigDecimal.ZERO.setScale(2);return BigDecimal.valueOf(days).divide(BigDecimal.valueOf(365),4,RoundingMode.HALF_UP).setScale(2,RoundingMode.HALF_UP);}
    private BigDecimal score(BigDecimal saved,String type,BigDecimal applicants,BigDecimal elapsed){if(saved!=null)return saved;if(applicants==null||applicants.compareTo(BigDecimal.ZERO)<=0)return BigDecimal.ZERO.setScale(2);return base(type,elapsed).divide(applicants,10,RoundingMode.DOWN).setScale(2,RoundingMode.DOWN);}
    private BigDecimal base(String type,BigDecimal elapsed){String t=StringValues.normalize(type);double years=elapsed==null?0:elapsed.doubleValue();if("신기술".equals(t))return BigDecimal.valueOf(2);if("특허".equals(t))return BigDecimal.valueOf(years<5?1:years<10?.8:.6);if("실용신안".equals(t))return BigDecimal.valueOf(years<5?.5:years<10?.4:0);return BigDecimal.ZERO;}
    private void validate(NewTechnologyDevelopmentRequest r){if(r==null)throw invalid("Request body is required.");StringValues.validateMaxLength(StringValues.normalize(r.sequenceLabel()),CODE_MAX_LENGTH,"sequenceLabel");StringValues.validateMaxLength(StringValues.required(r.title(),"title"),TITLE_MAX_LENGTH,"title");StringValues.validateMaxLength(StringValues.normalize(r.technologyType()),CODE_MAX_LENGTH,"technologyType");StringValues.validateMaxLength(StringValues.normalize(r.targetField()),CODE_MAX_LENGTH,"targetField");StringValues.validateMaxLength(StringValues.normalize(r.applicationNo()),CODE_MAX_LENGTH,"applicationNo");StringValues.validateMaxLength(StringValues.normalize(r.registrationNo()),CODE_MAX_LENGTH,"registrationNo");date(r.applicationDate(),"applicationDate",false);date(r.validUntil(),"validUntil",false);if(r.applicantCount()!=null&&r.applicantCount().compareTo(BigDecimal.ZERO)<=0)throw invalid("applicantCount must be greater than 0.");if(r.calculatedScore()!=null&&r.calculatedScore().compareTo(BigDecimal.ZERO)<0)throw invalid("calculatedScore must be greater than or equal to 0.");}
    private NewTechnologyDevelopmentRequest normalize(NewTechnologyDevelopmentRequest r){return new NewTechnologyDevelopmentRequest(blank(r.sequenceLabel()),StringValues.required(r.title(),"title"),blank(r.technologyType()),r.applicantCount(),r.calculatedScore(),date(r.applicationDate(),"applicationDate",false),blank(r.targetField()),blank(r.applicationNo()),blank(r.registrationNo()),date(r.validUntil(),"validUntil",false),blank(r.summary()),blank(r.remark()),r.useYn());}
    private LocalDate referenceDate(String value){String normalized=date(value,"scoreReferenceDate",false);return StringUtils.hasText(normalized)?LocalDate.parse(normalized,DATE_FORMATTER):LocalDate.now();}
    private String date(String value,String field,boolean required){String n=StringValues.normalize(value);if(!StringUtils.hasText(n)){if(required)throw invalid(field+" is required.");return null;}String compact=n.replace("-","");if(!compact.matches("\\d{8}"))throw invalid(field+" must be YYYYMMDD.");try{LocalDate.parse(compact,DATE_FORMATTER);}catch(DateTimeParseException e){throw invalid(field+" must be YYYYMMDD.");}return compact;}
    private String blank(String value){String n=StringValues.normalize(value);return StringUtils.hasText(n)?n:null;} private ResponseStatusException invalid(String message){return new ResponseStatusException(HttpStatus.BAD_REQUEST,message);} private ResponseStatusException notFound(){return new ResponseStatusException(HttpStatus.NOT_FOUND,"New technology development record was not found.");}
}
