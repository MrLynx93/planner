package com.planner.service;

import com.planner.dto.AnnexDto;
import com.planner.entity.Annex;
import com.planner.repository.AnnexRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AnnexService {

    private final AnnexRepository annexRepository;

    public List<AnnexDto> findAll() {
        return annexRepository.findAll().stream().map(this::toDto).toList();
    }

    public AnnexDto findById(Integer id) {
        return toDto(getOrThrow(id));
    }

    public AnnexDto create(AnnexDto dto) {
        Annex annex = new Annex();
        apply(annex, dto);
        return toDto(annexRepository.save(annex));
    }

    public AnnexDto update(Integer id, AnnexDto dto) {
        Annex annex = getOrThrow(id);
        apply(annex, dto);
        return toDto(annexRepository.save(annex));
    }

    public void delete(Integer id) {
        annexRepository.delete(getOrThrow(id));
    }

    public Annex getOrThrow(Integer id) {
        return annexRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Annex not found: " + id));
    }

    private void apply(Annex annex, AnnexDto dto) {
        annex.setName(dto.name());
        annex.setStartDate(dto.startDate());
        annex.setEndDate(dto.endDate());
        annex.setOpeningTime(dto.openingTime());
        annex.setClosingTime(dto.closingTime());
    }

    public AnnexDto toDto(Annex annex) {
        return new AnnexDto(
                annex.getId(),
                annex.getName(),
                annex.getStartDate(),
                annex.getEndDate(),
                annex.getOpeningTime(),
                annex.getClosingTime()
        );
    }
}
